import { extname, join, normalize } from 'node:path';
import serverEntry from '../dist/server/server.js';

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOSTNAME || '0.0.0.0';
const clientDir = join(process.cwd(), 'dist/client');

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
      return staticResponse;
    }

    return serverEntry.fetch(request);
  },
});

console.log(`[Server] Listening on http://${hostname}:${port}`);
