import { globalAccountRepository } from '@/lib/accounts/global-account-repository';
import { getCity } from '@/lib/db';
import {
  resolveBearerDeveloperPrincipal,
  resolveSessionDeveloperPrincipal,
  type DeveloperPrincipal,
} from '@/lib/auth/developer-principal';
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
      /** Authenticated dashboard session or OAuth bearer principal, if used. */
      principal: DeveloperPrincipal | null;
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
async function isAccountKeyAllowedForCurrentCity(apiKeyInfo: ApiKeyInfo): Promise<boolean> {
  if (!apiKeyInfo.accountId) return true;
  try {
    return await globalAccountRepository.hasCityAccess(
      apiKeyInfo.accountId,
      getCity()
    );
  } catch {
    return false;
  }
}

export async function enforcePublicApiAccess(
  options: PublicApiAccessOptions
): Promise<PublicApiAccessResult> {
  const providedKey = readApiKey(options.request.headers);
  const candidateApiKey = await validateApiKey(providedKey);
  const apiKeyInfo = candidateApiKey && await isAccountKeyAllowedForCurrentCity(candidateApiKey)
    ? candidateApiKey
    : null;
  const bearerPrincipal = apiKeyInfo ? null : await resolveBearerDeveloperPrincipal(options.request.headers);
  const sessionPrincipal = apiKeyInfo || bearerPrincipal ? null : await resolveSessionDeveloperPrincipal();
  const principal = bearerPrincipal ?? sessionPrincipal;
  const sessionEmail = principal?.authentication === 'session' ? principal.account.email : null;

  if (
    principal?.authentication === 'bearer' &&
    !principal.scopes.includes('read:dashboard')
  ) {
    return {
      ok: false,
      response: Response.json(
        { error: 'This route requires the read:dashboard scope.', authRequired: true, requiredScope: 'read:dashboard' },
        { status: 403 }
      ),
    };
  }

  if (
    options.requireApiKey &&
    principal?.authentication === 'bearer' &&
    !principal.scopes.includes('read:exports')
  ) {
    return {
      ok: false,
      response: Response.json(
        { error: 'This route requires the read:exports scope.', authRequired: true, requiredScope: 'read:exports' },
        { status: 403 }
      ),
    };
  }

  if (options.requireApiKey && !apiKeyInfo && !principal) {
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
          error: `This route needs credentials: send a valid ${API_KEY_HEADER}, log in at /developers, or send an Auth0 bearer token.`,
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
  } else if (principal) {
    rateLimits = { limit: DEFAULT_RATE_LIMIT, windowMs: DEFAULT_RATE_WINDOW_MS };
    rateLimitKey = `account:${principal.account.id}`;
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
    principal,
    sessionEmail,
  };
}
