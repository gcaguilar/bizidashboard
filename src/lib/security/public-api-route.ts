import { NextRequest, NextResponse } from 'next/server';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { logger } from '@/lib/logger';
import { enforcePublicApiAccess, type PublicApiAccessResult } from '@/lib/security/public-api';

export type PublicApiRouteHandler = (params: {
  request: NextRequest;
  requestId: string;
  clientIp: string;
  userAgent: string | null;
  access: PublicApiAccessResult & { ok: true };
}) => Promise<Response> | Response;

export type PublicApiRouteOptions = {
  route: string;
  routeGroup?: string;
  namespace: string;
  limit?: number;
  windowMs?: number;
  requireApiKey?: boolean | ((url: URL) => boolean);
  cacheControl?: string;
};

const DEFAULT_RATE_LIMIT = { limit: 30, windowMs: 60_000 };

export function withPublicApiRoute(
  options: PublicApiRouteOptions,
  handler: PublicApiRouteHandler
) {
  return async function (request: NextRequest): Promise<Response> {
    const requestId = crypto.randomUUID();
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      ?? request.headers.get('x-real-ip') 
      ?? '127.0.0.1';
    const userAgent = request.headers.get('user-agent') ?? null;

    const access = await enforcePublicApiAccess({
      route: options.route,
      request,
      requestId,
      clientIp,
      userAgent,
      namespace: options.namespace,
      limit: options.limit ?? DEFAULT_RATE_LIMIT.limit,
      windowMs: options.windowMs ?? DEFAULT_RATE_LIMIT.windowMs,
      requireApiKey: typeof options.requireApiKey === 'function' 
        ? options.requireApiKey(new URL(request.url))
        : (options.requireApiKey ?? false),
    });

    if (!access.ok) {
      return access.response;
    }

    try {
      const response = await handler({ request, requestId, clientIp, userAgent, access });
      
      if (options.cacheControl && response instanceof NextResponse) {
        response.headers.set('Cache-Control', options.cacheControl);
      }
      
      return response;
    } catch (error) {
      captureExceptionWithContext(error, {
        area: options.routeGroup ?? 'api',
        operation: options.route,
        extra: { requestId },
      });
      logger.error(`${options.routeGroup ?? 'api'}.failed`, { error, requestId });
      
      return NextResponse.json(
        {
          error: 'Internal server error',
          timestamp: new Date().toISOString(),
        },
        {
          status: 500,
          headers: access.headers,
        }
      );
    }
  };
}