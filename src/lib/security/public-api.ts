import { getDeveloperSession, isDeveloperSessionConfigured } from '@/lib/auth/developer-session';
import { recordSecurityEvent } from '@/lib/security/audit';
import { readApiKey } from '@/lib/security/http';
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit';
import {
  validateApiKey,
  getApiKeyRateLimits,
  API_KEY_HEADER,
  DEFAULT_RATE_LIMIT,
  DEFAULT_RATE_WINDOW_MS,
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
      /** Set when access was granted by a logged-in browser session. */
      sessionEmail: string | null;
    }
  | {
      ok: false;
      response: Response;
    };

/**
 * Reads the developer login cookie, if the portal is configured. Used as a
 * fallback credential so the dashboard's own UI can reach elevated routes:
 * a browser can't hold an API key (we only store its hash, and `<a download>`
 * navigations can't send headers), but it does carry this HttpOnly session.
 */
async function readSessionEmail(): Promise<string | null> {
  if (!isDeveloperSessionConfigured()) {
    return null;
  }

  try {
    const session = await getDeveloperSession();
    return session?.email ?? null;
  } catch {
    return null;
  }
}

export async function enforcePublicApiAccess(
  options: PublicApiAccessOptions
): Promise<PublicApiAccessResult> {
  const providedKey = readApiKey(options.request.headers);
  const apiKeyInfo = await validateApiKey(providedKey);
  const sessionEmail = apiKeyInfo ? null : await readSessionEmail();

  if (options.requireApiKey && !apiKeyInfo && !sessionEmail) {
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
          error: `This route needs credentials: send a valid ${API_KEY_HEADER}, or log in at /developers to use it from the dashboard.`,
          authRequired: true,
        },
        { status: 401 }
      ),
    };
  }

  // Each identified caller gets its own bucket: a key uses whatever limit it
  // was granted, a logged-in browser uses the standard one keyed by email, and
  // anonymous callers share the route's per-IP allowance.
  let rateLimits: { limit: number; windowMs: number };
  let rateLimitKey: string;

  if (apiKeyInfo) {
    rateLimits = getApiKeyRateLimits(apiKeyInfo);
    rateLimitKey = apiKeyInfo.id;
  } else if (sessionEmail) {
    rateLimits = { limit: DEFAULT_RATE_LIMIT, windowMs: DEFAULT_RATE_WINDOW_MS };
    rateLimitKey = `session:${sessionEmail}`;
  } else {
    rateLimits = { limit: options.limit, windowMs: options.windowMs };
    rateLimitKey = options.clientIp;
  }

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
    sessionEmail,
  };
}
