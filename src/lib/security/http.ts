import { createHash, timingSafeEqual } from 'node:crypto';
// Native Request/Response replace Request/Response
import { getCity } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  resolveRequestId,
  runWithExecutionContext,
  type ExecutionContext,
} from '@/lib/request-context';
import { getMobileAllowedHeaders, getMobileAllowedOrigins } from '@/lib/security/config';

function readHeader(
  headers: Headers,
  names: string[]
): string | null {
  for (const name of names) {
    const value = headers.get(name)?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');

  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return (
    readHeader(headers, ['x-real-ip', 'cf-connecting-ip', 'fly-client-ip']) ??
    'unknown'
  );
}

function getSecuritySalt(): string {
  const salt = process.env.SIGNATURE_SECRET || process.env.JWT_SECRET;
  if (!salt) {
    throw new Error('SECURITY_ERROR: SIGNATURE_SECRET or JWT_SECRET must be configured');
  }
  return salt;
}

export function hashSensitiveValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const salt = getSecuritySalt();
  return createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

export function isApiKeyValid(
  providedApiKey: string | null | undefined,
  expectedApiKey: string
): boolean {
  if (!providedApiKey) {
    return false;
  }

  const providedBuffer = Buffer.from(providedApiKey);
  const expectedBuffer = Buffer.from(expectedApiKey);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function readOpsApiKey(headers: Headers): string | null {
  return readHeader(headers, ['x-ops-api-key', 'x-collect-api-key']);
}

export function readPublicApiKey(headers: Headers): string | null {
  return readHeader(headers, ['x-public-api-key']);
}

export type RequestExecution = {
  requestId: string;
  clientIp: string;
  userAgent: string | null;
  startedAt: number;
};

export async function withApiRequest<T extends Response>(
  request: Request | Request,
  meta: Pick<ExecutionContext, 'route' | 'routeGroup'>,
  handler: (execution: RequestExecution) => Promise<T>
): Promise<T> {
  const requestId = resolveRequestId(request.headers);
  const clientIp = getClientIp(request.headers);
  const userAgent = request.headers.get('user-agent');
  const startedAt = Date.now();
  const context: ExecutionContext = {
    requestId,
    route: meta.route,
    routeGroup: meta.routeGroup,
    method: request.method,
    city: getCity(),
    ipHash: hashSensitiveValue(clientIp),
    userAgentHash: hashSensitiveValue(userAgent),
  };

  return runWithExecutionContext(context, async () => {
    logger.info('request.started', {
      route: meta.route,
      method: request.method,
    });

    try {
      const response = await handler({
        requestId,
        clientIp,
        userAgent,
        startedAt,
      });

      response.headers.set('X-Request-Id', requestId);
      logger.info('request.completed', {
        route: meta.route,
        method: request.method,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });

      return response;
    } catch (error) {
      logger.error('request.failed', {
        route: meta.route,
        method: request.method,
        durationMs: Date.now() - startedAt,
        error,
      });
      throw error;
    }
  });
}

export function buildMobileCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowedOrigins = getMobileAllowedOrigins();

  if (!origin) {
    return {
      Vary: 'Origin',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': getMobileAllowedHeaders(),
    };
  }

  if (!allowedOrigins.includes(origin)) {
    return { Vary: 'Origin' };
  }

  return {
    Vary: 'Origin',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': getMobileAllowedHeaders(),
  };
}

export function applyMobileCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(buildMobileCorsHeaders(request))) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function rejectDisallowedMobileOrigin(request: Request): Response | null {
  const origin = request.headers.get('origin');

  if (!origin) {
    return null;
  }

  const allowedOrigins = getMobileAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    return null;
  }

  return Response.json(
    { error: 'Origin not allowed' },
    {
      status: 403,
      headers: {
        Vary: 'Origin',
      },
    }
  );
}

/**
 * CSRF guard for cookie-authenticated, same-origin browser routes (e.g. the
 * developer portal). Browsers attach `Origin` on cross-site fetch/XHR
 * requests, so a mismatch means the request did not originate from our own
 * pages. A missing `Origin` is allowed through — same-site navigations and
 * non-browser clients (curl, server-to-server) don't reliably send it, and
 * those callers don't carry the session cookie anyway unless replayed
 * cross-site, which requires an `Origin` in every modern browser.
 *
 * Compares against the request's own `Host` (falling back to
 * `X-Forwarded-Host` behind a proxy) rather than a configured APP_URL: the
 * attacker's page can put anything in `Origin`, but a browser talking to
 * our server always sets `Host` to the domain it actually connected to, so
 * this can't be defeated by APP_URL drifting from the real serving domain
 * (custom domains, Vercel previews, local dev ports, etc.).
 */
export function rejectCrossOriginRequest(request: Request): Response | null {
  const origin = request.headers.get('origin');

  if (!origin) {
    return null;
  }

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const requestOrigin = new URL(request.url).origin;

  const isSameOrigin = host
    ? origin === `${new URL(requestOrigin).protocol}//${host}`
    : origin === requestOrigin;

  if (isSameOrigin) {
    return null;
  }

  return Response.json(
    { error: 'Cross-origin request rejected' },
    { status: 403, headers: { Vary: 'Origin' } }
  );
}

export function handleMobilePreflight(request: Request): Response {
  return rejectDisallowedMobileOrigin(request) ??
    new Response(null, {
      status: 204,
      headers: buildMobileCorsHeaders(request),
    });
}
