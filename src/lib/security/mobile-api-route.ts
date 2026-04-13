import { NextRequest, NextResponse } from 'next/server';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { logger } from '@/lib/logger';
import { rejectDisallowedMobileOrigin, buildMobileCorsHeaders } from '@/lib/security/http';
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit';

export type MobileApiRouteHandler = (params: {
  request: NextRequest;
  requestId: string;
  clientIp: string;
  userAgent: string | null;
}) => Promise<Response> | Response;

export type MobileApiRouteOptions = {
  route: string;
  routeGroup?: string;
  namespace: string;
  limit?: number;
  windowMs?: number;
};

const DEFAULT_MOBILE_RATE_LIMIT = { limit: 30, windowMs: 60_000 };

export function withMobileApiRoute(
  options: MobileApiRouteOptions,
  handler: MobileApiRouteHandler
) {
  return async function (request: NextRequest): Promise<Response> {
    const originRejection = rejectDisallowedMobileOrigin(request);
    if (originRejection) {
      return originRejection;
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
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        {
          status: 503,
          headers: { ...buildMobileCorsHeaders(request), ...headers },
        }
      );
    }

    if (!effectiveDecision.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          headers: {
            ...buildMobileCorsHeaders(request),
            ...headers,
            'Retry-After': String(effectiveDecision.retryAfterSeconds),
          },
        }
      );
    }

    try {
      const response = await handler({ request, requestId, clientIp, userAgent });
      
      if (response instanceof NextResponse) {
        const newHeaders = new Headers(response.headers);
        Object.entries(buildMobileCorsHeaders(request)).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });
        Object.entries(headers).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });
        
        return new NextResponse(response.body, {
          status: response.status,
          headers: newHeaders,
        });
      }
      
      return response;
    } catch (error) {
      captureExceptionWithContext(error, {
        area: options.routeGroup ?? 'mobile.api',
        operation: options.route,
        extra: { requestId },
      });
      logger.error(`${options.routeGroup ?? 'mobile.api'}.failed`, { error, requestId });
      
      return NextResponse.json(
        { error: 'Internal server error' },
        {
          status: 500,
          headers: buildMobileCorsHeaders(request),
        }
      );
    }
  };
}

export function withMobileOptions() {
  return function (_request: NextRequest): NextResponse {
    return new NextResponse(null, {
      status: 204,
      headers: buildMobileCorsHeaders(_request),
    });
  };
}