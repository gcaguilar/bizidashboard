// Response removed;
import { withProtect } from '@/lib/security/route-protection';
import type { RouteHandler, ProtectedRouteOptions } from '@/lib/security/route-protection';

export type MobileApiRouteHandler = RouteHandler;

export type MobileApiRouteOptions = ProtectedRouteOptions & {
  namespace: string;
  limit?: number;
  windowMs?: number;
};

const DEFAULT_MOBILE_RATE_LIMIT = { limit: 30, windowMs: 60_000 };

export function withMobileApiRoute(
  options: MobileApiRouteOptions,
  handler: MobileApiRouteHandler
) {
  return withProtect(
    options,
    async (request) => {
      const originRejection = rejectDisallowedMobileOrigin(request);
      if (originRejection) {
        return { ok: false, response: originRejection };
      }

      const requestId = crypto.randomUUID();
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? request.headers.get('x-real-ip')
        ?? '127.0.0.1';
      const userAgent = request.headers.get('user-agent') ?? null;

      const limit = options.limit ?? DEFAULT_MOBILE_RATE_LIMIT.limit;
      const windowMs = options.windowMs ?? DEFAULT_MOBILE_RATE_LIMIT.windowMs;

      const [ipDecision, tokenDecision] = await Promise.all([
        consumeRateLimit({
          namespace: `${options.namespace}:ip`,
          identifierParts: [clientIp],
          limit,
          windowMs,
        }),
        consumeRateLimit({
          namespace: `${options.namespace}:token`,
          identifierParts: [request.headers.get('x-refresh-token-fingerprint') ?? 'missing'],
          limit,
          windowMs,
        }),
      ]);

      const effectiveDecision = !ipDecision.allowed ? ipDecision : tokenDecision;
      const headers = getRateLimitHeaders(effectiveDecision);

      if (effectiveDecision.backend === 'unavailable') {
        return {
          ok: false,
          response: Response.json(
            { error: 'Service temporarily unavailable' },
            { status: 503, headers: { ...buildMobileCorsHeaders(request), ...headers } }
          ),
        };
      }

      if (!effectiveDecision.allowed) {
        return {
          ok: false,
          response: Response.json(
            { error: 'Too many requests' },
            {
              headers: {
                ...buildMobileCorsHeaders(request),
                ...headers,
                'Retry-After': String(effectiveDecision.retryAfterSeconds),
              },
            }
          ),
        };
      }

      return { ok: true, ctx: { request, requestId, clientIp, userAgent } };
    },
    async (ctx) => {
      const response = await handler(ctx);
      
      if (response instanceof Response) {
        const newHeaders = new Headers(response.headers);
        Object.entries(buildMobileCorsHeaders(ctx.request)).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });
        return new Response(response.body, {
          status: response.status,
          headers: newHeaders,
        });
      }
      
      return response;
    }
  );
}

export function withMobileOptions() {
  return function (_request: Request): Response {
    return new Response(null, {
      status: 204,
      headers: buildMobileCorsHeaders(_request),
    });
  };
}
