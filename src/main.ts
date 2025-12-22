import express from "express";
import path from "path";
import { conversionRouter } from "./infrastructure/http/routes/conversion.routes";
import { errorHandler } from "./infrastructure/http/middlewares/errorHandler";
import { ErrorRequestHandler } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./infrastructure/http/swagger";
import fs from "fs/promises";
import cron from "node-cron";
import { generatePostmanCollection } from "./infrastructure/http/postman";
import { ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET, S3_ENDPOINT } from "./infrastructure/storage/s3";

const app = express();
const PORT = process.env.PORT || 2200;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve locally stored converted files (fallback when S3 is not used)
const convertedStaticDir = path.join(
  __dirname,
  "infrastructure/public/converted"
);
app.use("/converted", express.static(convertedStaticDir));

// Swagger UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Redirect root to API docs for easy discovery
app.get("/", (_req, res) => {
  res.redirect("/api/docs");
});
app.get("/api/docs.json", (_req: any, res: any) => res.json(swaggerSpec));
app.get("/api/postman.json", (req: any, res: any) => {
  try {
    const proto = req.protocol;
    const host = req.get("host");
    const base = `${proto}://${host}`;
    const collection = generatePostmanCollection(swaggerSpec as any, base);
    res.json(collection);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate postman collection" });
  }
});

// Cron job: run every minute to delete converted files older than TTL
const TTL_MS = 30 * 60 * 1000; // 30 minutes

// Also run S3 cleanup if configured: remove objects under tmp/ and generated/ older than TTL
(() => {
  try {
    const TTL_MS_S3 = 30 * 60 * 1000;
    const prefixes = ["tmp/", "generated/", "converted/"];

    async function cleanupS3Once() {
      if (!s3Client || !S3_BUCKET) return;
      for (const prefix of prefixes) {
        try {
          const listResp: any = await s3Client.send(
            new ListObjectsV2Command({ Bucket: S3_BUCKET, Prefix: prefix })
          );
          const objs = listResp.Contents || [];
          for (const obj of objs) {
            try {
              const lastMod = obj.LastModified
                ? new Date(obj.LastModified).getTime()
                : 0;
              if (Date.now() - lastMod >= TTL_MS_S3) {
                await s3Client.send(
                  new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: obj.Key })
                );
              }
            } catch (err) {
              // ignore per-object errors
            }
          }
        } catch (err) {
          // ignore listing errors
        }
      }
    }

    // run on startup and every minute via cron
    cleanupS3Once().catch(() => {});
    cron.schedule("* * * * *", () => {
      cleanupS3Once().catch(() => {});
    });
  } catch (e) {
    // ignore S3 cleanup init errors
  }
})();

// API Routes
app.use("/api/convert", conversionRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
