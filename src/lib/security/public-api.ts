import { NextResponse } from 'next/server';
import { getPublicApiKey } from '@/lib/security/config';
import { recordSecurityEvent } from '@/lib/security/audit';
import { isApiKeyValid, readPublicApiKey } from '@/lib/security/http';
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit';

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

type PublicApiAccessResult =
  | {
      ok: true;
      headers: Record<string, string>;
      providedKey: string | null;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function enforcePublicApiAccess(
  options: PublicApiAccessOptions
): Promise<PublicApiAccessResult> {
  const publicApiKey = readPublicApiKey(options.request.headers);
  const configuredApiKey = getPublicApiKey();

  if (options.requireApiKey && !configuredApiKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Public API key is not configured for this elevated route.' },
        { status: 503 }
      ),
    };
  }

  const [ipDecision, keyDecision] = await Promise.all([
    consumeRateLimit({
      namespace: `${options.namespace}:ip`,
      identifierParts: [options.clientIp],
      limit: options.limit,
      windowMs: options.windowMs,
    }),
    consumeRateLimit({
      namespace: `${options.namespace}:key`,
      identifierParts: [publicApiKey ?? 'anonymous'],
      limit: options.limit,
      windowMs: options.windowMs,
    }),
  ]);

  const decision = !ipDecision.allowed ? ipDecision : keyDecision;
  const headers = getRateLimitHeaders(decision);

  if (decision.backend === 'unavailable') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Rate limiting backend unavailable.' },
        { status: 503, headers }
      ),
    };
  }

  if (!decision.allowed) {
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
      response: NextResponse.json(
        { error: 'Too many requests for this route.' },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': String(decision.retryAfterSeconds),
          },
        }
      ),
    };
  }

  if (options.requireApiKey && !isApiKeyValid(publicApiKey, configuredApiKey!)) {
    await recordSecurityEvent({
      eventType: 'auth_failed',
      route: options.route,
      requestId: options.requestId,
      ip: options.clientIp,
      userAgent: options.userAgent,
      outcome: 'denied',
      reasonCode: 'public_api_key_invalid',
    });

    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Valid X-Public-Api-Key required for this route.' },
        { status: 401, headers }
      ),
    };
  }

  return {
    ok: true,
    headers,
    providedKey: publicApiKey,
  };
}
