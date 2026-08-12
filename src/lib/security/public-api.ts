import { recordSecurityEvent } from '@/lib/security/audit';
import { readApiKey } from '@/lib/security/http';
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit';
import {
  validateApiKey,
  getApiKeyRateLimits,
  API_KEY_HEADER,
  type ApiKeyInfo,
} from '@/lib/security/api-keys';

type PublicApiAccessOptions = {
  route: string;
  request: Request;
  requestId: string;
  clientIp: string;
  userAgent: string | null;
  namespace: string;
  limit: number;
  windowMs: number;
  requireApiKey: boolean;
};

export type PublicApiAccessResult =
  | {
      ok: true;
      headers: Record<string, string>;
      providedKey: string | null;
      apiKeyInfo: ApiKeyInfo | null;
    }
  | {
      ok: false;
      response: Response;
    };

export async function enforcePublicApiAccess(
  options: PublicApiAccessOptions
): Promise<PublicApiAccessResult> {
  const providedKey = readApiKey(options.request.headers);
  const apiKeyInfo = await validateApiKey(providedKey);

  if (options.requireApiKey && !apiKeyInfo) {
    await recordSecurityEvent({
      eventType: 'auth_failed',
      route: options.route,
      requestId: options.requestId,
      ip: options.clientIp,
      userAgent: options.userAgent,
      outcome: 'denied',
      reasonCode: 'api_key_invalid',
    });

    return {
      ok: false,
      response: Response.json(
        {
          error: `A valid ${API_KEY_HEADER} is required for this route. Create one at /developers.`,
        },
        { status: 401 }
      ),
    };
  }

  // Anonymous callers share the per-IP allowance for the route; a valid key
  // gets its own bucket with whatever limit that key was granted.
  const rateLimits = apiKeyInfo
    ? getApiKeyRateLimits(apiKeyInfo)
    : { limit: options.limit, windowMs: options.windowMs };
  const rateLimitKey = apiKeyInfo?.id ?? options.clientIp;

  const keyDecision = await consumeRateLimit({
    namespace: `${options.namespace}:key`,
    identifierParts: [rateLimitKey],
    limit: rateLimits.limit,
    windowMs: rateLimits.windowMs,
  });

  const headers = getRateLimitHeaders(keyDecision);

  if (!keyDecision.allowed && keyDecision.backend !== 'unavailable') {
    await recordSecurityEvent({
      eventType: 'rate_limit_exceeded',
      route: options.route,
      requestId: options.requestId,
      ip: options.clientIp,
      userAgent: options.userAgent,
      outcome: 'denied',
      reasonCode: 'rate_limit',
    });

    return {
      ok: false,
      response: Response.json(
        { error: 'Too many requests for this route.' },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': String(keyDecision.retryAfterSeconds),
          },
        }
      ),
    };
  }

  return {
    ok: true,
    headers,
    providedKey,
    apiKeyInfo,
  };
}
