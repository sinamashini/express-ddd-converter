"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3_PUBLIC_BASE_URL = exports.S3_ENDPOINT = exports.S3_BUCKET = exports.s3Client = void 0;
const path_1 = __importDefault(require("path"));
// Lightweight S3 client initializer used across the app
let config = {};
try {
    config = require(path_1.default.join(process.cwd(), 'configs'));
}
catch (e) {
    config = {};
}
const S3_BUCKET = config.S3_BUCKET || process.env.S3_BUCKET;
exports.S3_BUCKET = S3_BUCKET;
const S3_ENDPOINT = config.S3_ENDPOINT || process.env.S3_ENDPOINT;
exports.S3_ENDPOINT = S3_ENDPOINT;
const S3_PUBLIC_BASE_URL = config.S3_PUBLIC_BASE_URL || process.env.S3_PUBLIC_BASE_URL;
exports.S3_PUBLIC_BASE_URL = S3_PUBLIC_BASE_URL;
const client_s3_1 = require("@aws-sdk/client-s3");
let s3Client = null;
exports.s3Client = s3Client;
if (S3_BUCKET &&
    (config.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID) &&
    (config.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY)) {
    const region = config.AWS_REGION || process.env.AWS_REGION || 'us-east-1';
    const endpoint = S3_ENDPOINT ? `https://${S3_ENDPOINT}` : undefined;
    exports.s3Client = s3Client = new client_s3_1.S3Client({
        region,
        endpoint,
        credentials: {
            accessKeyId: config.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: config.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
}
