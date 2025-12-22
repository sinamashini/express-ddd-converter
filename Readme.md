# 📦 express-ddd-converter

A simple Express.js app (written in TypeScript) that follows Domain-Driven Design (DDD) principles to handle different conversions like PDF to Markdown, Markdown to PDF, and more.

## 🧠 Description

This app exposes endpoints for uploading a file and converting it using libraries like:

- pdf-parse
- @opendocsg/pdf2md
- md-to-pdf

## 📁 Project Structure

```md
src/
├── application/ # Application logic and services
├── domain/ # Domain models and entities
├── errors/ # Centralized error handling
├── infrastructure/ # Express setup and adapters
└── main.ts # Application entry point
```

## 🚀 Getting Started

Prerequisites

- Node.js 18+
- npm

### Install dependencies

```sh
npm install
```

### Start the app in development mode

```sh
npm run dev
```

### Build for production

```sh
npm run build
```

### Start in production

```sh
npm run start
```

## 📦 Dependencies

- express
- multer – for file uploads
- pdf-parse – for extracting content from PDF
- @opendocsg/pdf2md – for converting PDF to Markdown
- md-to-pdf – for reverse conversion if needed

## 🧪 Dev Tools

- ts-node-dev for hot reloading
- rimraf for clean builds
- TypeScript types for Express, Node, and more

## 📘 API Docs & Generated Files

The project now exposes an OpenAPI/Swagger UI and a generated Postman collection for easy testing.


You can open the Swagger UI in your browser once the server is running:

```sh
# start dev server
npm run dev

# then open (dev)
http://localhost:2200/
```

In production (for example on Vercel), the base URL will be your deployed domain, e.g.:

```text
https://express-ddd-converter.vercel.app/
```

Useful endpoints:

- Swagger UI: `/api/docs` (root `/` redirects here)
- OpenAPI JSON: `/api/docs.json`
- Postman collection JSON: `/api/postman.json`

## 📤 Client upload examples

Use multipart/form-data for file uploads. Do not set the `Content-Type` header manually when using the browser `fetch` API — the browser will add the required boundary.

- curl example (send a file named `example.md`):

```sh
curl -F "file=@example.md" "http://localhost:2200/api/convert/md-to-pdf"
```

- curl example with RTL PDF (Markdown rendered right-to-left):

```sh
curl -F "file=@example.md" "http://localhost:2200/api/convert/md-to-pdf?dir=rtl"
```

- Browser `fetch` (do not set `Content-Type` header):

```js
const fd = new FormData();
fd.append('file', fileInput.files[0]);

fetch('/api/convert/md-to-pdf', {
	method: 'POST',
	body: fd,
})
	.then(res => res.json())
	.then(json => console.log(json))
	.catch(err => console.error(err));
```

- Postman: select Body → form-data, add a key `file` of type File and pick the file to upload.

If you manually set `Content-Type` to `multipart/form-data` without a boundary, the server will reject the request with a 400 error indicating a missing boundary.

## ⏳ Converted files expiry

Converted files are stored under `infrastructure/public/converted` on the server filesystem (and served via the `/converted/...` path) when S3 is not configured or when uploads to S3 fail. They are available via the download link for 30 minutes. After 30 minutes the server (or cleanup job) will automatically delete the converted file.

## 🧹 Cleanup options and how to run

The project includes a small cleanup utility to remove converted files older than 30 minutes. You can run it manually, run it as a background daemon, or rely on the in-process cron job when running the dev server.

- Run once (manual):

```sh
npm run cleanup
```

- Run as a daemon (runs every minute):

```sh
npm run cleanup:daemon
```

- In-process cron: the dev server (`npm run dev`) runs a cleanup job every minute. Running the server is sufficient for local development.

Deletion records are appended to `logs/deletions.log` for auditability.

## ☁️ S3 / DigitalOcean Spaces integration

You can configure the app to upload converted files to an S3-compatible bucket (DigitalOcean Spaces or AWS S3) instead of writing them to the local `infrastructure/public/converted` directory. When configured, the app uploads the original upload to `tmp/` and the generated output to `generated/` in the bucket and returns a public URL for the generated file.

Example environment variables for DigitalOcean Spaces:

```
AWS_REGION=sfo3
AWS_ACCESS_KEY_ID=DO_SPACES_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=DO_SPACES_SECRET
S3_BUCKET=converter-sina
S3_ENDPOINT=sfo3.digitaloceanspaces.com
S3_PUBLIC_BASE_URL=https://converter-sina.sfo3.digitaloceanspaces.com
```

Example environment variables for AWS S3:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=AWS_SECRET
S3_BUCKET=your-aws-bucket-name
# (AWS does not need S3_ENDPOINT normally)
```

Quick `configs/index.cjs` example (optional)

```js
// configs/index.cjs
require('dotenv').config();
module.exports = {
	AWS_REGION: process.env.AWS_REGION,
	AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
	AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
	S3_BUCKET: process.env.S3_BUCKET,
	S3_ENDPOINT: process.env.S3_ENDPOINT, // e.g. sfo3.digitaloceanspaces.com
	S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL, // optional override for public URL
};
```

Notes and behavior:
- Store credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) in environment variables or your deployment's secret manager — do not commit them.
- If `S3_PUBLIC_BASE_URL` is set, it will be used to build the returned download URL. Otherwise the app falls back to `https://{bucket}.{endpoint}/{key}` for S3-compatible endpoints.
- The application uploads the incoming file to `tmp/` in the bucket (private) and the converted output to `generated/` (public-readable). Both `tmp/` and `generated/` objects older than the configured TTL (default 30 minutes) are removed by the cleanup job.
- The cleanup logic checks `tmp/`, `generated/`, and `converted/` prefixes when S3 is configured.
- TTL is currently 30 minutes by default (see the cleanup code in `src/main.ts` and `scripts/cleanup.js`). To change it, modify the constant in those files.

Cleanup and audit
- The cleanup script will remove expired objects in the bucket and append deletion records to `logs/deletions.log`.
- Run the cleanup utility manually:

```sh
npm run cleanup
```

- Run it as a background daemon (runs every minute):

```sh
npm run cleanup:daemon
```

If you prefer a single centralized cleanup worker in production (recommended for cluster deployments), run the script on a single scheduled worker rather than relying on in-process cron jobs across multiple app instances.

