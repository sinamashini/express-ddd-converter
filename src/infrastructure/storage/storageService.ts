import path from 'path';
import fs from 'fs/promises';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, S3_ENDPOINT, S3_PUBLIC_BASE_URL } from './s3';

const convertedDir = path.join(__dirname, '../../infrastructure/public/converted');

export async function ensureConvertedDir() {
  await fs.mkdir(convertedDir, { recursive: true });
}

export function convertedDirPath() {
  return convertedDir;
}

export async function writeLocalConverted(filename: string, body: Buffer) {
  await ensureConvertedDir();
  const outPath = path.join(convertedDir, filename);
  await fs.writeFile(outPath, body);
  return `/converted/${filename}`;
}

export async function uploadTmp(key: string, body: Buffer, contentType?: string) {
  if (!s3Client || !S3_BUCKET) return false;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ACL: 'private',
      ContentType: contentType || 'application/octet-stream',
    })
  );
  return true;
}

export async function uploadGenerated(key: string, body: Buffer, contentType?: string) {
  if (!s3Client || !S3_BUCKET) return false;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ACL: 'public-read',
      ContentType: contentType || 'application/octet-stream',
    })
  );
  return true;
}

export function getPublicUrlForKey(key: string) {
  if (S3_PUBLIC_BASE_URL) {
    return `${S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  }
  if (S3_BUCKET) {
    return `https://${S3_BUCKET}.${S3_ENDPOINT || 's3.amazonaws.com'}/${key}`;
  }
  return null;
}
