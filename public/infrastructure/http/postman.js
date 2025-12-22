"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePostmanCollection = generatePostmanCollection;
function generatePostmanCollection(swagger, baseUrl) {
    const defaultBase = (swagger.servers && swagger.servers[0] && swagger.servers[0].url) ||
        "http://localhost:2200";
    const base = baseUrl || defaultBase;
    const items = [];
    for (const [path, pathItem] of Object.entries(swagger.paths || {})) {
        if (!pathItem)
            continue;
        const methods = Object.entries(pathItem);
        for (const [method, operation] of methods) {
            if (["get", "post", "put", "delete", "patch", "head", "options"].includes(method)) {
                const name = operation.summary ||
                    operation.operationId ||
                    `${method.toUpperCase()} ${path}`;
                const request = {
                    method: method.toUpperCase(),
                    header: [],
                    body: undefined,
                    url: {
                        raw: `${base.replace(/\/$/, "")}${path}`,
                        host: [base.replace(/https?:\/\//, "")],
                        path: path.split("/").filter(Boolean),
                    },
                };
                // If requestBody expects multipart/form-data, set body accordingly
                if (operation.requestBody && operation.requestBody.content) {
                    const content = operation.requestBody.content;
                    if (content["multipart/form-data"]) {
                        request.header.push({
                            key: "Content-Type",
                            value: "multipart/form-data",
                        });
                        request.body = {
                            mode: "formdata",
                            formdata: [{ key: "file", type: "file" }],
                        };
                    }
                    else if (content["application/json"]) {
                        request.header.push({
                            key: "Content-Type",
                            value: "application/json",
                        });
                        request.body = {
                            mode: "raw",
                            raw: JSON.stringify(operation.requestBody.example || {}),
                        };
                    }
                }
                items.push({ name, request });
            }
        }
    }
    const collection = {
        info: {
            name: swagger.info?.title || "API Collection",
            version: swagger.info?.version || "1.0.0",
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        item: items,
    };
    return collection;
}
exports.default = generatePostmanCollection;
