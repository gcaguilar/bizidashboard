import { createFileRoute } from '@tanstack/react-router'
import { getStationPatterns } from '@/analytics/queries/read'
import { withCache } from '@/lib/cache/cache'
import { errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { enforcePublicApiAccess } from '@/lib/security/public-api'

const PUBLIC_ROUTE_RATE_LIMIT = { limit: 30, windowMs: 60_000 }

export const Route = createFileRoute('/api/patterns/')({
  server: {
    handlers: {
      GET: async (opts) => {
        const request = opts.request
        try {
          const stationId = new URL(request.url).searchParams.get('stationId')
          if (!stationId || stationId.trim().length < 1 || stationId.trim().length > 64) {
            return new Response(JSON.stringify({ error: 'stationId query parameter is required (max 64 chars)' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
          }
          const access = await enforcePublicApiAccess({ route: '/api/patterns', request, requestId: '', clientIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '', userAgent: request.headers.get('user-agent') || '', namespace: 'public-patterns', limit: PUBLIC_ROUTE_RATE_LIMIT.limit, windowMs: PUBLIC_ROUTE_RATE_LIMIT.windowMs, requireApiKey: false })
          if (!access.ok) return access.response
          const patterns = await withCache(`patterns:stationId=${stationId}`, 300, () => getStationPatterns(stationId, undefined))
          return new Response(JSON.stringify(patterns), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', ...access.headers } })
        } catch (error) {
          captureExceptionWithContext(error, { area: 'api.patterns', operation: 'GET /api/patterns' })
          logger.error('api.patterns.failed', { error })
          return errorResponse('Failed to fetch station patterns', 500)
        }
      },
    },
  },
})
