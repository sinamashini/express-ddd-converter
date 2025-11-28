"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureConvertedDir = ensureConvertedDir;
exports.convertedDirPath = convertedDirPath;
exports.writeLocalConverted = writeLocalConverted;
exports.uploadTmp = uploadTmp;
exports.uploadGenerated = uploadGenerated;
exports.getPublicUrlForKey = getPublicUrlForKey;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_1 = require("./s3");
const convertedDir = path_1.default.join(__dirname, '../../infrastructure/public/converted');
async function ensureConvertedDir() {
    await promises_1.default.mkdir(convertedDir, { recursive: true });
}
function convertedDirPath() {
    return convertedDir;
}
async function writeLocalConverted(filename, body) {
    await ensureConvertedDir();
    const outPath = path_1.default.join(convertedDir, filename);
    await promises_1.default.writeFile(outPath, body);
    return `/converted/${filename}`;
}
async function uploadTmp(key, body, contentType) {
    if (!s3_1.s3Client || !s3_1.S3_BUCKET)
        return false;
    await s3_1.s3Client.send(new client_s3_1.PutObjectCommand({
        Bucket: s3_1.S3_BUCKET,
        Key: key,
        Body: body,
        ACL: 'private',
        ContentType: contentType || 'application/octet-stream',
    }));
    return true;
}
async function uploadGenerated(key, body, contentType) {
    if (!s3_1.s3Client || !s3_1.S3_BUCKET)
        return false;
    await s3_1.s3Client.send(new client_s3_1.PutObjectCommand({
        Bucket: s3_1.S3_BUCKET,
        Key: key,
        Body: body,
        ACL: 'public-read',
        ContentType: contentType || 'application/octet-stream',
    }));
    return true;
}
function getPublicUrlForKey(key) {
    if (s3_1.S3_PUBLIC_BASE_URL) {
        return `${s3_1.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
    }
    if (s3_1.S3_BUCKET) {
        return `https://${s3_1.S3_BUCKET}.${s3_1.S3_ENDPOINT || 's3.amazonaws.com'}/${key}`;
    }
    return null;
}
