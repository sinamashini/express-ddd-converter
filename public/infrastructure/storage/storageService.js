import path from 'path';
import { fileURLToPath } from "url";
import fs from 'fs/promises';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, S3_ENDPOINT, S3_PUBLIC_BASE_URL } from "./s3.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const convertedDir = path.join(__dirname, "../public/converted");
export async function ensureConvertedDir() {
    await fs.mkdir(convertedDir, { recursive: true });
}
export function convertedDirPath() {
    return convertedDir;
}
export async function writeLocalConverted(filename, body) {
    await ensureConvertedDir();
    const outPath = path.join(convertedDir, filename);
    await fs.writeFile(outPath, body);
    return `/converted/${filename}`;
}
export async function uploadTmp(key, body, contentType) {
    if (!s3Client || !S3_BUCKET)
        return false;
    await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ACL: 'private',
        ContentType: contentType || 'application/octet-stream',
    }));
    return true;
}
export async function uploadGenerated(key, body, contentType) {
    if (!s3Client || !S3_BUCKET)
        return false;
    await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ACL: 'public-read',
        ContentType: contentType || 'application/octet-stream',
    }));
    return true;
}
export function getPublicUrlForKey(key) {
    if (S3_PUBLIC_BASE_URL) {
        return `${S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
    }
    if (S3_BUCKET) {
        return `https://${S3_BUCKET}.${S3_ENDPOINT || 's3.amazonaws.com'}/${key}`;
    }
    return null;
}
export function getContentType(filename) {
    if (filename.endsWith(".pdf"))
        return "application/pdf";
    if (filename.endsWith(".md"))
        return "text/markdown";
    if (filename.endsWith(".txt"))
        return "text/plain";
    if (filename.endsWith(".docx"))
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return "application/octet-stream";
}
