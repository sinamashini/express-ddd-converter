#!/usr/bin/env node
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

const TTL_MS = 30 * 60 * 1000; // 30 minutes
const convertedDir = path.join(process.cwd(), 'infrastructure/public/converted');
const logFile = path.join(process.cwd(), 'logs/deletions.log');
const S3_BUCKET = process.env.S3_BUCKET;
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

let s3 = null;
let ListObjectsV2Command, DeleteObjectCommand;
if (S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  try {
    const { S3Client } = require('@aws-sdk/client-s3');
    const cmds = require('@aws-sdk/client-s3');
    ListObjectsV2Command = cmds.ListObjectsV2Command;
    DeleteObjectCommand = cmds.DeleteObjectCommand;
    const endpoint = S3_ENDPOINT ? `https://${S3_ENDPOINT}` : undefined;
    s3 = new S3Client({
      region: AWS_REGION,
      endpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  } catch (e) {
    console.error('Failed to initialize S3 client:', e.message);
  }
}

async function ensureLogDir() {
  const logDir = path.dirname(logFile);
  await fsp.mkdir(logDir, { recursive: true });
}

async function logDeletion(name) {
  try {
    await ensureLogDir();
    const line = `${new Date().toISOString()} deleted ${name}\n`;
    await fsp.appendFile(logFile, line);
  } catch (e) {
    // ignore logging errors
  }
}

async function runOnce() {
  try {
    await fsp.mkdir(convertedDir, { recursive: true });
    const files = await fsp.readdir(convertedDir);
    for (const file of files) {
      const filePath = path.join(convertedDir, file);
      try {
        const stat = await fsp.stat(filePath);
        if (Date.now() - stat.mtimeMs >= TTL_MS) {
          await fsp.unlink(filePath);
          console.log('deleted', file);
          await logDeletion(file);
        }
      } catch (e) {
        console.error('error handling file', file, e.message);
      }
    }
    // cleanup S3 objects if configured
    if (s3 && S3_BUCKET) {
      try {
        const listResp = await s3.send(new ListObjectsV2Command({ Bucket: S3_BUCKET, Prefix: 'converted/' }));
        const objs = (listResp.Contents || []);
        for (const obj of objs) {
          try {
            const lastMod = obj.LastModified ? new Date(obj.LastModified).getTime() : 0;
            if (Date.now() - lastMod >= TTL_MS) {
              await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: obj.Key }));
              console.log('deleted s3', obj.Key);
              await logDeletion(`s3:${obj.Key}`);
            }
          } catch (e) {
            console.error('error deleting s3 object', obj.Key, e.message);
          }
        }
      } catch (e) {
        console.error('error listing s3 objects', e.message);
      }
    }
  } catch (e) {
    console.error('cleanup error', e.message);
  }
}

function runDaemon() {
  console.log('Starting cleanup daemon: will run every minute');
  runOnce().catch(() => {});
  cron.schedule('* * * * *', () => {
    runOnce().catch(() => {});
  });
}

// CLI args
const args = process.argv.slice(2);
if (args.includes('--daemon') || args.includes('--watch')) {
  runDaemon();
} else {
  runOnce().then(() => process.exit(0));
}
