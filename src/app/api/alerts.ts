import { createFileRoute } from '@tanstack/react-router'
import { getActiveAlerts } from '@/analytics/queries/read'
import { errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { withApiRequest } from '@/lib/security/http'
import { enforcePublicApiAccess } from '@/lib/security/public-api'

async function alertsHandler(input?: { request?: Request } | Request) {
  const request = input && typeof input === 'object' && 'request' in input ? input.request : input

  if (!request) {
    try {
      const alerts = await getActiveAlerts(50)
      const payload = { limit: 50, alerts, generatedAt: new Date().toISOString() }

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=300' },
      })
    } catch (error) {
      captureExceptionWithContext(error, { area: 'api.alerts', operation: 'GET /api/alerts' })
      logger.error('api.alerts.failed', { error })
      return new Response(JSON.stringify({ error: 'Failed to fetch alerts' }), { status: 500 })
    }
  }

  return withApiRequest(
    request,
    { route: '/api/alerts', routeGroup: 'public.api' },
    async ({ requestId, clientIp, userAgent }) => {
      try {
        const limitParam = request?.url ? parseInt(new URL(request.url).searchParams.get('limit') ?? '50') : 50
        const limit = Math.min(Math.max(1, limitParam), 200)

        const access = await enforcePublicApiAccess({
          route: '/api/alerts',
          request,
          requestId,
          clientIp,
          userAgent,
          namespace: 'public-alerts',
          limit: 40,
          windowMs: 60_000,
          requireApiKey: false,
        })

        if (!access.ok) return access.response

        const alerts = await getActiveAlerts(limit)
        const payload = { limit, alerts, generatedAt: new Date().toISOString() }

        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=300', ...access.headers },
        })
      } catch (error) {
        return errorResponse('Failed to fetch alerts', 500)
      }
    }
  )
}

export const Route = createFileRoute('/api/alerts')({
  server: {
    handlers: {
      GET: alertsHandler,
    },
  },
})

export const GET = alertsHandler
