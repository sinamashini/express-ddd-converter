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

- **Swagger UI**: `GET /api/docs` — interactive API docs (web UI)
- **OpenAPI JSON**: `GET /api/docs.json` and `GET /api/openapi.json` — raw OpenAPI spec
- **Postman collection**: `GET /api/postman.json` — generated Postman v2.1 collection derived from the OpenAPI spec

You can open the Swagger UI in your browser once the server is running:

```sh
# start dev server
npm run dev

# then open
http://localhost:2200/api/docs
```

Or fetch the JSON directly:

```sh
curl http://localhost:2200/api/openapi.json
curl http://localhost:2200/api/postman.json
```

If you'd like a higher-fidelity Postman conversion, I can switch to the `openapi-to-postmanv2` converter and serve that instead.
