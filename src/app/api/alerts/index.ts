import { createFileRoute } from '@tanstack/react-router'
import { getActiveAlerts } from '@/analytics/queries/read'
import { errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { enforcePublicApiAccess } from '@/lib/security/public-api'

export const Route = createFileRoute('/api/alerts/')({
  server: {
    handlers: {
      GET: async (opts) => {
        const request = opts.request
        try {
          const limitParam = parseInt(new URL(request.url).searchParams.get('limit') ?? '50')
          const limit = Math.min(Math.max(1, limitParam), 200)

          const access = await enforcePublicApiAccess({
            route: '/api/alerts',
            request,
            requestId: '',
            clientIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
            userAgent: request.headers.get('user-agent') || '',
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
          captureExceptionWithContext(error, { area: 'api.alerts', operation: 'GET /api/alerts' })
          logger.error('api.alerts.failed', { error })
          return errorResponse('Failed to fetch alerts', 500)
        }
      },
    },
  },
})
