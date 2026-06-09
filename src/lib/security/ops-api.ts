// Response removed;
import { withProtect, type RouteContext } from '@/lib/security/route-protection';
import type { RouteHandler } from '@/lib/security/route-protection';
import { getOpsApiKey } from '@/lib/security/config';
import { isApiKeyValid, readOpsApiKey } from '@/lib/security/http';
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit';

export type OperationalAccessOptions = {
  namespace: string;
  limit?: number;
  windowMs?: number;
  unauthorizedError?: string;
  rateLimitError?: string;
  misconfiguredError?: string;
};

export type OperationalAccessResult =
  | { ok: true; headers: Record<string, string>; providedKey: string }
  | { ok: false; response: Response };

const DEFAULT_OPS_RATE_LIMIT = { limit: 10, windowMs: 60_000 };

function errorResponse(
  status: number,
  error: string,
  headers?: Record<string, string>
): Response {
  return Response.json(
    { success: false, error, timestamp: new Date().toISOString() },
    { status, headers }
  );
}

type OpsApiCtx = RouteContext & { requestId: string; clientIp: string; userAgent: string | null };

export function withOperationalAccess(
  options: OperationalAccessOptions,
  handler: RouteHandler
) {
  return withProtect<OpsApiCtx>(
    { route: options.namespace, ...options, routeGroup: 'ops.api' },
    async (ctx) => {
      const req = ctx.request;
      const requestId = crypto.randomUUID();
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? req.headers.get('x-real-ip')
        ?? '127.0.0.1';
      const userAgent = req.headers.get('user-agent') ?? null;

      const expectedApiKey = getOpsApiKey();
      const limit = options.limit ?? DEFAULT_OPS_RATE_LIMIT.limit;
      const windowMs = options.windowMs ?? DEFAULT_OPS_RATE_LIMIT.windowMs;

      if (!expectedApiKey) {
        return { ok: false, response: errorResponse(503, options.misconfiguredError ?? 'Server misconfigured: OPS_API_KEY is required.') };
      }

      const providedKey = readOpsApiKey(req.headers) ?? '';
      const [ipDecision, keyDecision] = await Promise.all([
        consumeRateLimit({
          namespace: `${options.namespace}:ip`,
          identifierParts: [clientIp],
          limit,
          windowMs,
        }),
        consumeRateLimit({
          namespace: `${options.namespace}:key`,
          identifierParts: [providedKey || 'missing'],
          limit,
          windowMs,
        }),
      ]);

      const effectiveDecision = !ipDecision.allowed ? ipDecision : keyDecision;
      const headers = getRateLimitHeaders(effectiveDecision);

      if (!effectiveDecision.allowed && effectiveDecision.backend !== 'unavailable') {
        return { ok: false, response: errorResponse(429, options.rateLimitError ?? 'Too many requests.', { ...headers, 'Retry-After': String(effectiveDecision.retryAfterSeconds) }) };
      }

      if (!isApiKeyValid(providedKey, expectedApiKey)) {
        return { ok: false, response: errorResponse(401, options.unauthorizedError ?? 'Unauthorized. Valid OPS_API_KEY required.', headers) };
      }

      return { ok: true, ctx: { ...ctx, requestId, clientIp, userAgent } };
    },
    async (ctx) => {
      const result = await handler(ctx);
      return result;
    }
  );
}

export async function enforceOperationalAccess(
  options: OperationalAccessOptions & { request: Request; clientIp: string }
): Promise<OperationalAccessResult> {
  const expectedApiKey = getOpsApiKey();
  const limit = options.limit ?? DEFAULT_OPS_RATE_LIMIT.limit;
  const windowMs = options.windowMs ?? DEFAULT_OPS_RATE_LIMIT.windowMs;

  if (!expectedApiKey) {
    return { ok: false, response: errorResponse(503, options.misconfiguredError ?? 'Server misconfigured: OPS_API_KEY is required.') };
  }

  const providedKey = readOpsApiKey(options.request.headers) ?? '';
  const [ipDecision, keyDecision] = await Promise.all([
    consumeRateLimit({
      namespace: `${options.namespace}:ip`,
      identifierParts: [options.clientIp],
      limit,
      windowMs,
    }),
    consumeRateLimit({
      namespace: `${options.namespace}:key`,
      identifierParts: [providedKey || 'missing'],
      limit,
      windowMs,
    }),
  ]);

  const effectiveDecision = !ipDecision.allowed ? ipDecision : keyDecision;
  const headers = getRateLimitHeaders(effectiveDecision);

  if (!effectiveDecision.allowed && effectiveDecision.backend !== 'unavailable') {
    return { ok: false, response: errorResponse(429, options.rateLimitError ?? 'Too many requests.', { ...headers, 'Retry-After': String(effectiveDecision.retryAfterSeconds) }) };
  }

  if (!isApiKeyValid(providedKey, expectedApiKey)) {
    return { ok: false, response: errorResponse(401, options.unauthorizedError ?? 'Unauthorized. Valid OPS_API_KEY required.', headers) };
  }

  return { ok: true, headers, providedKey };
}
