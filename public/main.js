"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const conversion_routes_1 = require("./infrastructure/http/routes/conversion.routes");
const errorHandler_1 = require("./infrastructure/http/middlewares/errorHandler");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("./infrastructure/http/swagger"));
const node_cron_1 = __importDefault(require("node-cron"));
const postman_1 = require("./infrastructure/http/postman");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_1 = require("./infrastructure/storage/s3");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 2200;
// Middleware to parse JSON bodies
app.use(express_1.default.json());
// Serve locally stored converted files (fallback when S3 is not used)
const convertedStaticDir = path_1.default.join(__dirname, "infrastructure/public/converted");
app.use("/converted", express_1.default.static(convertedStaticDir));
// Swagger UI
app.use("/api/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
// Redirect root to API docs for easy discovery
app.get("/", (_req, res) => {
    res.redirect("/api/docs");
});
app.get("/api/docs.json", (_req, res) => res.json(swagger_1.default));
app.get("/api/postman.json", (req, res) => {
    try {
        const proto = req.protocol;
        const host = req.get("host");
        const base = `${proto}://${host}`;
        const collection = (0, postman_1.generatePostmanCollection)(swagger_1.default, base);
        res.json(collection);
    }
    catch (err) {
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
            if (!s3_1.s3Client || !s3_1.S3_BUCKET)
                return;
            for (const prefix of prefixes) {
                try {
                    const listResp = await s3_1.s3Client.send(new client_s3_1.ListObjectsV2Command({ Bucket: s3_1.S3_BUCKET, Prefix: prefix }));
                    const objs = listResp.Contents || [];
                    for (const obj of objs) {
                        try {
                            const lastMod = obj.LastModified
                                ? new Date(obj.LastModified).getTime()
                                : 0;
                            if (Date.now() - lastMod >= TTL_MS_S3) {
                                await s3_1.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: s3_1.S3_BUCKET, Key: obj.Key }));
                            }
                        }
                        catch (err) {
                            // ignore per-object errors
                        }
                    }
                }
                catch (err) {
                    // ignore listing errors
                }
            }
        }
        // run on startup and every minute via cron
        cleanupS3Once().catch(() => { });
        node_cron_1.default.schedule("* * * * *", () => {
            cleanupS3Once().catch(() => { });
        });
    }
    catch (e) {
        // ignore S3 cleanup init errors
    }
})();
// API Routes
app.use("/api/convert", conversion_routes_1.conversionRouter);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
