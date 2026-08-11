// Response removed;
import { recordSecurityEvent } from '@/lib/security/audit';
import { getOpsApiKey } from '@/lib/security/config';
import { getClientIp, isApiKeyValid, readOpsApiKey } from '@/lib/security/http';
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

export type OperationalRouteContext = {
  clientIp: string;
  userAgent: string;
  headers: Record<string, string>;
};

/**
 * Sobre común para rutas operativas: resuelve IP/UA, aplica clave + rate limit,
 * audita las denegaciones con el mapeo estándar y entrega al handler los
 * headers de rate limit para propagarlos en la respuesta.
 */
export async function handleOperationalRoute(
  request: Request,
  options: OperationalAccessOptions & { route: string },
  handler: (ctx: OperationalRouteContext) => Promise<Response>
): Promise<Response> {
  const clientIp = getClientIp(request.headers);
  const userAgent = request.headers.get('user-agent') || '';

  const access = await enforceOperationalAccess({ request, clientIp, ...options });

  if (!access.ok) {
    const status = access.response.status;
    const eventType =
      status === 429 ? 'rate_limit_exceeded' : status === 401 ? 'auth_failed' : 'ops_unavailable';
    await recordSecurityEvent({
      eventType,
      route: options.route,
      requestId: '',
      ip: clientIp,
      userAgent,
      outcome: status === 503 ? 'error' : 'denied',
      reasonCode: access.response.statusText || String(status),
    });
    return access.response;
  }

  return handler({ clientIp, userAgent, headers: access.headers });
}
