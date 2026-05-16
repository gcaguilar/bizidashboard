// Response removed;
import { enforcePublicApiAccess, type PublicApiAccessResult } from '@/lib/security/public-api';
import { withProtect, type RouteContext } from '@/lib/security/route-protection';
import type { RouteHandler, ProtectedRouteOptions } from '@/lib/security/route-protection';

export type PublicApiRouteHandler = (params: RouteContext & { access: PublicApiAccessResult }) => Promise<Response> | Response;

export type PublicApiRouteOptions = ProtectedRouteOptions & {
  namespace: string;
  limit?: number;
  windowMs?: number;
  requireApiKey?: boolean | ((url: URL) => boolean);
};

export function withPublicApiRoute(
  options: PublicApiRouteOptions,
  handler: PublicApiRouteHandler
) {
  return withProtect(
    options,
    async (request) => {
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
        limit: options.limit ?? 30,
        windowMs: options.windowMs ?? 60_000,
        requireApiKey: typeof options.requireApiKey === 'function'
          ? options.requireApiKey(new URL(request.url))
          : (options.requireApiKey ?? false),
      });

      if (!access.ok) {
        return { ok: false, response: access.response };
      }

      return { ok: true, ctx: { request, requestId, clientIp, userAgent } };
    },
    handler
  );
}
