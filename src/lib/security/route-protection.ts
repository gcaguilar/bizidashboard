// Response removed;
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { logger } from '@/lib/logger';

export type ProtectedRouteOptions = {
  route: string;
  routeGroup?: string;
  cacheControl?: string;
};

export type RouteContext = {
  request: Request;
  requestId: string;
  clientIp: string;
  userAgent: string | null;
};

export type RouteHandler = (ctx: RouteContext) => Promise<Response> | Response;

export type RouteResult =
  | { ok: false; response: Response }
  | { ok: true; ctx: RouteContext };

export type RouteGuard = (params: RouteContext) => Promise<RouteResult>;

export function withProtect(
  options: ProtectedRouteOptions,
  guard: RouteGuard,
  handler: RouteHandler
) {
  return async function (params: { request: Request } & Record<string, unknown>): Promise<Response> {
    const request = params.request;
    const requestId = crypto.randomUUID();
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? '127.0.0.1';
    const userAgent = request.headers.get('user-agent') ?? null;

    const result = await guard({ request, requestId, clientIp, userAgent });

    if (!result.ok) {
      return result.response;
    }

    try {
      const response = await handler(result.ctx);

      if (options.cacheControl && response instanceof Response) {
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

      return Response.json(
        { error: 'Internal server error', timestamp: new Date().toISOString() },
        { status: 500 }
      );
    }
  };
}
