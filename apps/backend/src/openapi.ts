import { contract } from "@library/contracts";
import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod";

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

let spec: unknown;

export async function openApiSpec(): Promise<unknown> {
  spec ??= await generator.generate(contract, {
    info: {
      title: "Personal Library API",
      version: "1.0.0",
      description: "Generated from the same Zod contract the typed client uses.",
    },
    servers: [{ url: "/api/v1" }],
  });

  return spec;
}

export const docsPage = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Personal Library API</title>
  </head>
  <body>
    <script id="api-reference" data-url="/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
