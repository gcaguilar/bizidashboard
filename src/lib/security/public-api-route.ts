// Response removed;
import { enforcePublicApiAccess, type PublicApiAccessResult } from '@/lib/security/public-api';
import { withProtect, type RouteContext, type RouteResult } from '@/lib/security/route-protection';

type PublicApiCtx = RouteContext & { access: Extract<PublicApiAccessResult, { ok: true }> };

export type PublicApiRouteHandler = (params: PublicApiCtx) => Promise<Response> | Response;

export type PublicApiRouteOptions = {
  route: string;
  routeGroup?: string;
  namespace: string;
  limit?: number;
  windowMs?: number;
  requireApiKey?: boolean | ((url: URL) => boolean);
  cacheControl?: string;
};

export function withPublicApiRoute(
  options: PublicApiRouteOptions,
  handler: PublicApiRouteHandler
) {
  return withProtect<PublicApiCtx>(
    { route: options.route, routeGroup: options.routeGroup, cacheControl: options.cacheControl },
    async (ctx) => {
      const access = await enforcePublicApiAccess({
        route: options.route,
        request: ctx.request,
        requestId: ctx.requestId,
        clientIp: ctx.clientIp,
        userAgent: ctx.userAgent,
        namespace: options.namespace,
        limit: options.limit ?? 30,
        windowMs: options.windowMs ?? 60_000,
        requireApiKey: typeof options.requireApiKey === 'function'
          ? options.requireApiKey(new URL(ctx.request.url))
          : (options.requireApiKey ?? false),
      });

      if (!access.ok) {
        return { ok: false, response: access.response };
      }

      const enrichedCtx: PublicApiCtx = { ...ctx, access };
      return { ok: true, ctx: enrichedCtx };
    },
    handler
  );
}
