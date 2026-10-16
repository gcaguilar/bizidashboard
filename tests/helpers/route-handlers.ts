/**
 * TanStack Start types `server.handlers` as a union of the object form
 * (`{ GET, POST, ... }`) and the function form, so accessing `handlers.GET`
 * directly is a type error. Tests only exercise the object form, so this
 * helper narrows the union to a plain, callable record.
 */
type RouteWithHandlers = {
  options: {
    server?: unknown
  }
}

export type TestRouteHandler = (context?: any) => any

export function serverHandlers(route: RouteWithHandlers): Record<string, TestRouteHandler> {
  const server = route.options.server as { handlers?: unknown } | undefined
  return (server?.handlers ?? {}) as Record<string, TestRouteHandler>
}
