const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const NODE_ENV = process.env.NODE_ENV || 'development';
const base = process.cwd();

// Prefer environment-specific file: .env.local for development, .env.prod for production
const localEnv = path.join(base, '.env.local');
const prodEnv = path.join(base, '.env.prod');

if (NODE_ENV === 'production' && fs.existsSync(prodEnv)) {
  dotenv.config({ path: prodEnv });
} else if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
} else {
  // fallback to .env if present
  const envFile = path.join(base, '.env');
  if (fs.existsSync(envFile)) dotenv.config({ path: envFile });
}

module.exports = {
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL,
  S3_USE_HTTPS: process.env.S3_USE_HTTPS === 'true',
};
