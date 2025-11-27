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

const app = express();
const PORT = process.env.PORT || 2200;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve converted files statically
const publicDir = path.join(__dirname, "./infrastructure/public");
app.use(express.static(publicDir));

// Swagger UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (_req: any, res: any) => res.json(swaggerSpec));
app.get("/api/postman.json", (_req: any, res: any) => {
  try {
    const collection = generatePostmanCollection(swaggerSpec as any);
    res.json(collection);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate postman collection" });
  }
});

// On startup: clean up converted files older than TTL and schedule deletion for remaining ones
async function initConvertedCleanup() {
  try {
    const convertedDir = path.join(__dirname, "./infrastructure/public/converted");
    const TTL_MS = 30 * 60 * 1000; // 30 minutes
    const logFile = path.join(__dirname, "../../logs/deletions.log");

    // ensure directory exists
    await fs.mkdir(convertedDir, { recursive: true });

    const files = await fs.readdir(convertedDir);
    for (const file of files) {
      const filePath = path.join(convertedDir, file);
      try {
        const stat = await fs.stat(filePath);
        const age = Date.now() - stat.mtime.getTime();
        if (age >= TTL_MS) {
          // too old, delete
          await fs.unlink(filePath);
          // log deletion
          try {
            await fs.mkdir(path.dirname(logFile), { recursive: true });
            await fs.appendFile(logFile, `${new Date().toISOString()} deleted ${file}\n`);
          } catch (e) {
            // ignore logging errors
          }
        } else {
          // schedule deletion after remaining time
          const remaining = TTL_MS - age;
          setTimeout(async () => {
            try {
              await fs.unlink(filePath);
            } catch (e) {
              // ignore
            }
          }, remaining);
        }
      } catch (e) {
        // ignore errors for individual files
      }
    }
  } catch (e) {
    // ignore startup cleanup errors
  }
}

initConvertedCleanup();

// Cron job: run every minute to delete converted files older than TTL
const TTL_MS = 30 * 60 * 1000; // 30 minutes
cron.schedule("* * * * *", async () => {
  try {
    const convertedDir = path.join(__dirname, "./infrastructure/public/converted");
    const files = await fs.readdir(convertedDir);
    for (const file of files) {
      const filePath = path.join(convertedDir, file);
      try {
        const stat = await fs.stat(filePath);
        if (Date.now() - stat.mtime.getTime() >= TTL_MS) {
          await fs.unlink(filePath);
        }
      } catch (e) {
        // ignore per-file errors
      }
    }
  } catch (e) {
    // ignore cron job errors
  }
});

// API Routes
app.use("/api/convert", conversionRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
