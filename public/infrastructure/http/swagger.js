"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
exports.swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "Express DDD Converter API",
        version: "1.0.0",
        description: "API for converting files between PDF, Markdown, Word and text",
    },
    servers: [
        {
            url: "http://localhost:2200",
            description: "Local server",
        },
    ],
    paths: {
        "/api/convert/md-to-pdf": {
            post: {
                summary: "Convert Markdown to PDF",
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    file: {
                                        type: "string",
                                        format: "binary",
                                    },
                                },
                                required: ["file"],
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Conversion successful",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        filename: { type: "string" },
                                        url: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/convert/pdf-to-md": {
            post: {
                summary: "Convert PDF to Markdown",
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    file: { type: "string", format: "binary" },
                                },
                                required: ["file"],
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "Conversion successful" },
                },
            },
        },
        "/api/convert/pdf-to-txt": {
            post: {
                summary: "Convert PDF to plain text",
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    file: { type: "string", format: "binary" },
                                },
                                required: ["file"],
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "Conversion successful" },
                },
            },
        },
        "/api/convert/pdf-to-word": {
            post: {
                summary: "Convert PDF to Word (docx)",
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    file: { type: "string", format: "binary" },
                                },
                                required: ["file"],
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "Conversion successful" },
                },
            },
        },
    },
};
exports.default = exports.swaggerSpec;
