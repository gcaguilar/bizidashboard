import { extname, join, normalize } from 'node:path';
import serverEntry from '../dist/server/server.js';
import {
  buildContentSecurityPolicy,
  getContentSecurityPolicyHeader,
} from '../src/lib/security/csp.mjs';

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOSTNAME || '0.0.0.0';
const clientDir = join(process.cwd(), 'dist/client');

const CSP_HEADER = getContentSecurityPolicyHeader();
const CSP_VALUE = buildContentSecurityPolicy();

function addSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '0');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (!headers.has('Content-Security-Policy') && !headers.has('Content-Security-Policy-Report-Only')) {
    headers.set(CSP_HEADER, CSP_VALUE);
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

// Cuando el cliente corta la conexion, h3 propaga un AbortError envuelto en un
// HTTPError 500. Sin esto Bun lo vuelca entero como error no controlado y ese
// ruido tapa los fallos reales del servidor.
function isClientAbort(error, request) {
  if (request?.signal?.aborted) {
    return true;
  }

  let current = error;
  for (let depth = 0; current && depth < 5; depth += 1) {
    const message = typeof current.message === 'string' ? current.message : '';
    if (current.name === 'AbortError' || message.includes('The connection was closed')) {
      return true;
    }
    current = current.cause;
  }

  return false;
}

Bun.serve({
  hostname,
  port,
  async fetch(request) {
    try {
      const staticResponse = await serveStaticAsset(request);
      if (staticResponse) {
        return addSecurityHeaders(staticResponse);
      }

      return addSecurityHeaders(await serverEntry.fetch(request));
    } catch (error) {
      if (isClientAbort(error, request)) {
        // 499: el cliente cerro la conexion, no hay nadie leyendo la respuesta.
        return new Response(null, { status: 499 });
      }

      console.error(`[Server] Unhandled error on ${request.method} ${request.url}:`, error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
  error(error) {
    if (isClientAbort(error)) {
      return new Response(null, { status: 499 });
    }

    console.error('[Server] Fatal error:', error);
    return new Response('Internal Server Error', { status: 500 });
  },
});

console.log(`[Server] Listening on http://${hostname}:${port}`);
