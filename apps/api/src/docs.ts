import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/**
 * Swagger UI loads from jsDelivr (pinned, with Subresource Integrity) instead of local files, so the docs page works
 * the same in Docker and on serverless hosts that only ship the files the code imports.
 */
const SWAGGER_UI = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.34.0';
const BUNDLE_SRI = 'sha384-9Td7MKiIr2S83E1kZyyVi8KdJw/S8CpAvu0llLyMeg0xq/hDGiZJfVn0fV4llCmK';
const CSS_SRI = 'sha384-4c3vsE5f+trhFyHrFrLM1fFGUn531NIaC7dcqEWIJdoRQJ5CkJbSuSCwXLpaS1KF';

const DOCS_CSP = [
  "default-src 'self'",
  `script-src 'self' ${SWAGGER_UI}/`,
  `style-src 'self' 'unsafe-inline' ${SWAGGER_UI}/`,
  "img-src 'self' data: https://cdn.jsdelivr.net",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ');

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stamped API</title>
<link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css" integrity="${CSS_SRI}" crossorigin="anonymous">
</head>
<body>
<div id="swagger-ui"></div>
<script src="${SWAGGER_UI}/swagger-ui-bundle.js" integrity="${BUNDLE_SRI}" crossorigin="anonymous"></script>
<script src="/api/docs/init.js"></script>
</body>
</html>`;

const INIT = `window.ui = SwaggerUIBundle({ url: '/api/docs/openapi.json', dom_id: '#swagger-ui', deepLinking: true });\n`;

/** Serves the OpenAPI document at /api/docs/openapi.json and an interactive page at /api/docs. */
export function mountApiDocs(app: INestApplication, document: OpenAPIObject): void {
  SwaggerModule.setup('api/docs', app, document, { swaggerUiEnabled: false, jsonDocumentUrl: 'api/docs/openapi.json' });
  const http = (app as NestExpressApplication).getHttpAdapter().getInstance();
  http.get('/api/docs', (_req: unknown, res: DocsResponse) => {
    res.set('Content-Security-Policy', DOCS_CSP).type('html').send(PAGE);
  });
  http.get('/api/docs/init.js', (_req: unknown, res: DocsResponse) => {
    res.set('Cache-Control', 'public, max-age=3600').type('application/javascript').send(INIT);
  });
}

interface DocsResponse {
  set(field: string, value: string): DocsResponse;
  type(type: string): DocsResponse;
  send(body: string): void;
}
