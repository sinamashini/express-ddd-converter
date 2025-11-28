import path from 'path';
// Lightweight S3 client initializer used across the app
let config: any = {};
try {
  config = require(path.join(process.cwd(), 'configs'));
} catch (e) {
  config = {};
}

const S3_BUCKET = config.S3_BUCKET || process.env.S3_BUCKET;
const S3_ENDPOINT = config.S3_ENDPOINT || process.env.S3_ENDPOINT;
const S3_PUBLIC_BASE_URL = config.S3_PUBLIC_BASE_URL || process.env.S3_PUBLIC_BASE_URL;

import { S3Client } from '@aws-sdk/client-s3';

let s3Client: S3Client | null = null;
if (
  S3_BUCKET &&
  (config.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID) &&
  (config.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY)
) {
  const region = config.AWS_REGION || process.env.AWS_REGION || 'us-east-1';
  const endpoint = S3_ENDPOINT ? `https://${S3_ENDPOINT}` : undefined;
  s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export { s3Client, S3_BUCKET, S3_ENDPOINT, S3_PUBLIC_BASE_URL };
