import { extname, join, normalize } from 'node:path';
import serverEntry from '../dist/server/server.js';

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOSTNAME || '0.0.0.0';
const clientDir = join(process.cwd(), 'dist/client');

const UMAMI_SCRIPT_ORIGINS = [
  'https://cloud.umami.is',
];
const UMAMI_CONNECT_ORIGINS = [
  ...UMAMI_SCRIPT_ORIGINS,
  'https://api-gateway.umami.dev',
];

function addSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '0');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (!headers.has('Content-Security-Policy')) {
    headers.set('Content-Security-Policy', [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' https://fonts.googleapis.com ${UMAMI_SCRIPT_ORIGINS.join(' ')}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      `connect-src 'self' https://nominatim.openstreetmap.org ${UMAMI_CONNECT_ORIGINS.join(' ')}`,
      "frame-ancestors 'none'",
    ].join('; '));
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.wasm', 'application/wasm'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
]);

function resolveClientPath(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const relativePath = normalize(decodedPath.replace(/^\/+/, ''));

  if (relativePath.startsWith('..')) {
    return null;
  }

  return join(clientDir, relativePath);
}

async function serveStaticAsset(request) {
  const url = new URL(request.url);

  if (!url.pathname.startsWith('/assets/') && !url.pathname.startsWith('/data/') && !url.pathname.includes('.')) {
    return null;
  }

  const filePath = resolveClientPath(url.pathname);
  if (!filePath) {
    return null;
  }

  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    return null;
  }

  const headers = new Headers();
  const contentType = contentTypes.get(extname(filePath));
  if (contentType) {
    headers.set('content-type', contentType);
  }
  headers.set('cache-control', url.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=300');

  return new Response(file, { headers });
}

Bun.serve({
  hostname,
  port,
  async fetch(request) {
    const staticResponse = await serveStaticAsset(request);
    if (staticResponse) {
      return addSecurityHeaders(staticResponse);
    }

    return addSecurityHeaders(await serverEntry.fetch(request));
  },
});

console.log(`[Server] Listening on http://${hostname}:${port}`);
