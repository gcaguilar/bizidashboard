import { useEffect } from 'react'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'

/**
 * Reports a TanStack Router `errorComponent` error to Sentry exactly once per
 * error instance.
 *
 * Sentry already captures unhandled errors globally and server-side errors via
 * the global middlewares; errors rendered by a route `errorComponent` are
 * swallowed by the router and must be reported explicitly.
 */
export function RouteErrorReporter({
  error,
  area,
  operation,
}: {
  error: unknown
  area: string
  operation?: string
}) {
  useEffect(() => {
    captureExceptionWithContext(error, {
      area,
      operation: operation ?? 'route.errorComponent',
    })
  }, [error, area, operation])

  return null
}
