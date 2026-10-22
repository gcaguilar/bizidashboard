// Response removed;
import { enforcePublicApiAccess, type PublicApiAccessResult } from '@/lib/security/public-api';
import { withProtect, type RouteContext } from '@/lib/security/route-protection';

type PublicApiCtx = RouteContext & { access: Extract<PublicApiAccessResult, { ok: true }> };

export type PublicApiRouteHandler = (params: PublicApiCtx) => Promise<Response> | Response;

export type PublicApiRouteOptions = {
  route: string;
  routeGroup?: string;
  namespace: string;
  limit?: number;
  windowMs?: number;
  requireApiKey?: boolean | ((url: URL) => boolean);
  cacheControl?: string;
};

/**
 * Applies the access headers (rate-limit metadata) to a handler's response.
 * Handlers no longer have to remember `...access.headers`, so they can't drop
 * them by accident — locality for the header contract.
 */
function applyAccessHeaders(
  response: Response,
  headers: Record<string, string>
): Response {
  for (const [name, value] of Object.entries(headers)) {
    if (!response.headers.has(name)) {
      response.headers.set(name, value);
    }
  }
  return response;
}

/**
 * FNV-1a de 32 bits en hex. Barato (una pasada por el string ya serializado) y
 * suficiente para 304: el cliente solo compara el ETag de la misma URL, y dos
 * payloads distintos que colisionaran exigirían ~65 K respuestas para una
 * probabilidad de 1/2^32.
 */
function fnv1a32Hex(value: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

function normalizeEtag(value: string): string {
  // `W/"abc"` y `"abc"` comparan igual para GET (validación débil).
  return value.trim().replace(/^W\//, '');
}

function ifNoneMatchSatisfied(request: Request, etag: string): boolean {
  const header = request.headers.get('if-none-match');

  if (!header) {
    return false;
  }

  const normalizedEtag = normalizeEtag(etag);

  return header
    .split(',')
    .map((candidate) => normalizeEtag(candidate))
    .some((candidate) => candidate === '*' || candidate === normalizedEtag);
}

/**
 * Revalida con `ETag`/`304` las respuestas de lectura. Los payloads grandes
 * (`/api/stations`, `/api/mobility`, `/api/history`) se siguen regenerando desde
 * caché, pero un cliente que ya los tiene no vuelve a descargarlos.
 *
 * Solo aplica a GET 200 JSON/CSV construidos por el handler; los errores y las
 * respuestas no cacheables pasan intactos.
 */
async function withEntityTag(request: Request, response: Response): Promise<Response> {
  if (request.method !== 'GET' || response.status !== 200) {
    return response;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isRevalidable =
    contentType.includes('application/json') || contentType.includes('text/csv');

  if (!isRevalidable) {
    return response;
  }

  // Estas rutas ya construyen el cuerpo a partir de un string; re-materializarlo
  // para hashearlo es despreciable frente a serializarlo otra vez.
  const body = await response.text();
  const etag = `"${fnv1a32Hex(body)}"`;
  const headers = new Headers(response.headers);
  headers.set('ETag', etag);

  if (ifNoneMatchSatisfied(request, etag)) {
    // 304 sin cuerpo. Se conservan las cabeceras de acceso (rate limit) y
    // `Cache-Control` se añade después en `withProtect`, igual que en el 200.
    headers.delete('Content-Length');
    return new Response(null, { status: 304, headers });
  }

  return new Response(body, { status: 200, headers });
}

export function withPublicApiRoute(
  options: PublicApiRouteOptions,
  handler: PublicApiRouteHandler
) {
  return withProtect<PublicApiCtx>(
    { route: options.route, routeGroup: options.routeGroup, cacheControl: options.cacheControl },
    async (ctx) => {
      const access = await enforcePublicApiAccess({
        route: options.route,
        request: ctx.request,
        requestId: ctx.requestId,
        clientIp: ctx.clientIp,
        userAgent: ctx.userAgent,
        namespace: options.namespace,
        limit: options.limit ?? 30,
        windowMs: options.windowMs ?? 60_000,
        requireApiKey: typeof options.requireApiKey === 'function'
          ? options.requireApiKey(new URL(ctx.request.url))
          : (options.requireApiKey ?? false),
      });

      if (!access.ok) {
        return { ok: false, response: access.response };
      }

      const enrichedCtx: PublicApiCtx = { ...ctx, access };
      return { ok: true, ctx: enrichedCtx };
    },
    async (ctx) =>
      withEntityTag(ctx.request, applyAccessHeaders(await handler(ctx), ctx.access.headers))
  );
}
