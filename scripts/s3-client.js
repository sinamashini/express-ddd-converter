const path = require('path');
let config = {};
try {
  config = require(path.join(process.cwd(), 'configs'));
} catch (e) {
  config = {};
}

const { S3Client } = require('@aws-sdk/client-s3');

const S3_BUCKET = config.S3_BUCKET || process.env.S3_BUCKET;
const S3_ENDPOINT = config.S3_ENDPOINT || process.env.S3_ENDPOINT;

let s3 = null;
if (
  S3_BUCKET &&
  (config.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID) &&
  (config.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY)
) {
  const region = config.AWS_REGION || process.env.AWS_REGION || 'us-east-1';
  const endpoint = S3_ENDPOINT ? `https://${S3_ENDPOINT}` : undefined;
  s3 = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

module.exports = { s3, S3_BUCKET, S3_ENDPOINT };
