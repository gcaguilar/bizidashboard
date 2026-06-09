// Response removed;
import { withProtect, type RouteContext } from '@/lib/security/route-protection';
import type { RouteHandler, ProtectedRouteOptions } from '@/lib/security/route-protection';
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { buildMobileCorsHeaders, rejectDisallowedMobileOrigin } from '@/lib/security/http';

export type MobileApiRouteHandler = RouteHandler;

export type MobileApiRouteOptions = ProtectedRouteOptions & {
  namespace: string;
  limit?: number;
  windowMs?: number;
};

type MobileApiCtx = RouteContext & { requestId: string; clientIp: string; userAgent: string | null };

const DEFAULT_MOBILE_RATE_LIMIT = { limit: 30, windowMs: 60_000 };

export function withMobileApiRoute(
  options: MobileApiRouteOptions,
  handler: MobileApiRouteHandler
) {
  return withProtect<MobileApiCtx>(
    options,
    async (ctx) => {
      const req = ctx.request;
      const originRejection = rejectDisallowedMobileOrigin(req);
      if (originRejection) {
        return { ok: false, response: originRejection };
      }

      const requestId = crypto.randomUUID();
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? req.headers.get('x-real-ip')
        ?? '127.0.0.1';
      const userAgent = req.headers.get('user-agent') ?? null;

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
          identifierParts: [req.headers.get('x-refresh-token-fingerprint') ?? 'missing'],
          limit,
          windowMs,
        }),
      ]);

      const effectiveDecision = !ipDecision.allowed ? ipDecision : tokenDecision;
      const headers = getRateLimitHeaders(effectiveDecision);

      if (!effectiveDecision.allowed && effectiveDecision.backend !== 'unavailable') {
        return {
          ok: false,
          response: Response.json(
            { error: 'Too many requests' },
            {
              headers: {
                ...buildMobileCorsHeaders(req),
                ...headers,
                'Retry-After': String(effectiveDecision.retryAfterSeconds),
              },
            }
          ),
        };
      }

      return { ok: true, ctx: { ...ctx, requestId, clientIp, userAgent } };
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
