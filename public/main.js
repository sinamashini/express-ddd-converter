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
const app = (0, express_1.default)();
const PORT = process.env.PORT || 2200;
// Middleware to parse JSON bodies
app.use(express_1.default.json());
// Swagger UI
app.use("/api/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
app.get("/api/docs.json", (_req, res) => res.json(swagger_1.default));
app.get("/api/postman.json", (_req, res) => {
    try {
        const collection = (0, postman_1.generatePostmanCollection)(swagger_1.default);
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
        const configsPath = path_1.default.join(process.cwd(), 'configs');
        let config = {};
        try {
            config = require(configsPath);
        }
        catch (e) {
            config = {};
        }
        const S3_BUCKET = config.S3_BUCKET || process.env.S3_BUCKET;
        const S3_ENDPOINT = config.S3_ENDPOINT || process.env.S3_ENDPOINT;
        const AWS_REGION = config.AWS_REGION || process.env.AWS_REGION || 'us-east-1';
        let s3 = null;
        if (S3_BUCKET &&
            (config.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID) &&
            (config.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY)) {
            const endpoint = S3_ENDPOINT ? `https://${S3_ENDPOINT}` : undefined;
            s3 = new client_s3_1.S3Client({
                region: AWS_REGION,
                endpoint,
                credentials: {
                    accessKeyId: config.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: config.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
                },
            });
        }
        const TTL_MS_S3 = 30 * 60 * 1000;
        const prefixes = ['tmp/', 'generated/', 'converted/'];
        async function cleanupS3Once() {
            if (!s3 || !S3_BUCKET)
                return;
            for (const prefix of prefixes) {
                try {
                    const listResp = await s3.send(new client_s3_1.ListObjectsV2Command({ Bucket: S3_BUCKET, Prefix: prefix }));
                    const objs = (listResp.Contents || []);
                    for (const obj of objs) {
                        try {
                            const lastMod = obj.LastModified ? new Date(obj.LastModified).getTime() : 0;
                            if (Date.now() - lastMod >= TTL_MS_S3) {
                                await s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: S3_BUCKET, Key: obj.Key }));
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
        node_cron_1.default.schedule('* * * * *', () => { cleanupS3Once().catch(() => { }); });
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
