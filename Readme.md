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

# then open
http://localhost:2200/api/docs
```

Or fetch the JSON directly:

```sh
curl http://localhost:2200/api/openapi.json
curl http://localhost:2200/api/postman.json
```

## ⏳ Converted files expiry

Converted files are stored under `infrastructure/public/converted` and are available via the download link for 30 minutes. After 30 minutes the server will automatically delete the converted file.

If you want this folder tracked in Git (for example to include a placeholder), create a `.gitkeep` file inside it and commit that file. Example:

```sh
# create folder (if missing) and add a .gitkeep so Git tracks the directory
mkdir -p infrastructure/public/converted
touch infrastructure/public/converted/.gitkeep
git add infrastructure/public/converted/.gitkeep
git commit -m "chore: add .gitkeep for converted files directory"
```

Note: it's usually recommended *not* to commit generated files (actual converted outputs). Tracking the folder only (via `.gitkeep`) is a harmless way to ensure the directory exists in the repository.

