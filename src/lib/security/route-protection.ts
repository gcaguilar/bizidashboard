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

export type RouteResult<T extends RouteContext = RouteContext> =
  | { ok: false; response: Response }
  | { ok: true; ctx: T };

export type RouteGuard<T extends RouteContext = RouteContext> = (params: RouteContext) => Promise<RouteResult<T>>;

export function withProtect<T extends RouteContext = RouteContext>(
  options: ProtectedRouteOptions,
  guard: RouteGuard<T>,
  handler: (ctx: T) => Promise<Response> | Response
) {
  return async function (params: object): Promise<Response> {
    const request = (params as Record<string, unknown>).request as Request;
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
