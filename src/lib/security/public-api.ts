import { NextResponse } from 'next/server';
import { getPublicApiKey } from '@/lib/security/config';
import { recordSecurityEvent } from '@/lib/security/audit';
import { isApiKeyValid, readPublicApiKey } from '@/lib/security/http';
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit';
import {
  validateApiKey,
  getApiKeyRateLimits,
  isMultiKeySystemEnabled,
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

type PublicApiAccessResult =
  | {
      ok: true;
      headers: Record<string, string>;
      providedKey: string | null;
      apiKeyInfo: ApiKeyInfo | null;
    }
  | {
      ok: false;
      response: NextResponse;
    };

/**
 * Validate API key using either multi-key system or legacy single-key
 */
async function validatePublicApiKey(
  providedKey: string | null
): Promise<{ valid: boolean; info: ApiKeyInfo | null }> {
  // Legacy single-key mode
  if (!isMultiKeySystemEnabled()) {
    const configuredKey = getPublicApiKey();
    if (!configuredKey) {
      return { valid: false, info: null };
    }
    const valid = isApiKeyValid(providedKey, configuredKey);
    return { valid, info: null };
  }

  // Multi-key system
  if (!providedKey) {
    return { valid: false, info: null };
  }

  const info = await validateApiKey(providedKey);
  return { valid: info !== null, info };
}

export async function enforcePublicApiAccess(
  options: PublicApiAccessOptions
): Promise<PublicApiAccessResult> {
  const publicApiKey = readPublicApiKey(options.request.headers);

  // Check if API key system is configured
  if (options.requireApiKey && !isMultiKeySystemEnabled() && !getPublicApiKey()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Public API key is not configured for this elevated route.' },
        { status: 503 }
      ),
    };
  }

  // Validate the API key
  const validation = await validatePublicApiKey(publicApiKey);

  if (options.requireApiKey && !validation.valid) {
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
        { status: 401 }
      ),
    };
  }

  // Get rate limits (custom per key or defaults)
  const rateLimits = validation.info
    ? getApiKeyRateLimits(validation.info)
    : { limit: options.limit, windowMs: options.windowMs };

  // Apply rate limiting per key (or IP if no key)
  const rateLimitKey = validation.info?.id ?? publicApiKey ?? options.clientIp;
  const keyDecision = await consumeRateLimit({
    namespace: `${options.namespace}:key`,
    identifierParts: [rateLimitKey],
    limit: rateLimits.limit,
    windowMs: rateLimits.windowMs,
  });

  const headers = getRateLimitHeaders(keyDecision);

  if (keyDecision.backend === 'unavailable') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Rate limiting backend unavailable.' },
        { status: 503, headers }
      ),
    };
  }

  if (!keyDecision.allowed) {
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
            'Retry-After': String(keyDecision.retryAfterSeconds),
          },
        }
      ),
    };
  }

  return {
    ok: true,
    headers,
    providedKey: publicApiKey,
    apiKeyInfo: validation.info,
  };
}
