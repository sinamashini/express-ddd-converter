import { OpenAPIV3 } from "openapi-types";

export function generatePostmanCollection(swagger: OpenAPIV3.Document) {
  const baseUrl = (swagger.servers && swagger.servers[0] && swagger.servers[0].url) || "http://localhost:2200";

  const items: any[] = [];

  for (const [path, pathItem] of Object.entries(swagger.paths || {})) {
    if (!pathItem) continue;
    const methods = Object.entries(pathItem as any) as Array<[string, any]>;
    for (const [method, operation] of methods) {
      if (["get", "post", "put", "delete", "patch", "head", "options"].includes(method)) {
        const name = operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`;

        const request: any = {
          method: method.toUpperCase(),
          header: [],
          body: undefined,
          url: {
            raw: `${baseUrl.replace(/\/$/, "")}${path}`,
            host: [baseUrl.replace(/https?:\/\//, "")],
            path: path.split("/").filter(Boolean),
          },
        };

        // If requestBody expects multipart/form-data, set body accordingly
        if (operation.requestBody && (operation.requestBody as any).content) {
          const content = (operation.requestBody as any).content;
          if (content["multipart/form-data"]) {
            request.header.push({ key: "Content-Type", value: "multipart/form-data" });
            request.body = {
              mode: "formdata",
              formdata: [
                { key: "file", type: "file" },
              ],
            };
          } else if (content["application/json"]) {
            request.header.push({ key: "Content-Type", value: "application/json" });
            request.body = {
              mode: "raw",
              raw: JSON.stringify((operation.requestBody as any).example || {}),
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

export default generatePostmanCollection;
