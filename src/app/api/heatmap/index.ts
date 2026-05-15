import { createFileRoute } from '@tanstack/react-router'
import { getHeatmap } from '@/analytics/queries/read'
import { withCache } from '@/lib/cache/cache'
import { errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { enforcePublicApiAccess } from '@/lib/security/public-api'

const PUBLIC_ROUTE_RATE_LIMIT = { limit: 30, windowMs: 60_000 }

export const Route = createFileRoute('/api/heatmap/')({
  server: {
    handlers: {
      GET: async (opts) => {
        const request = opts.request
        try {
          const stationId = new URL(request.url).searchParams.get('stationId')
          if (!stationId || stationId.trim().length < 1 || stationId.trim().length > 64) {
            return new Response(JSON.stringify({ error: 'stationId query parameter is required (max 64 chars)' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
          }
          const access = await enforcePublicApiAccess({ route: '/api/heatmap', request, requestId: '', clientIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '', userAgent: request.headers.get('user-agent') || '', namespace: 'public-heatmap', limit: PUBLIC_ROUTE_RATE_LIMIT.limit, windowMs: PUBLIC_ROUTE_RATE_LIMIT.windowMs, requireApiKey: false })
          if (!access.ok) return access.response
          const heatmap = await withCache(`heatmap:stationId=${stationId}`, 300, () => getHeatmap(stationId, undefined))
          return new Response(JSON.stringify(heatmap), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', ...access.headers } })
        } catch (error) {
          captureExceptionWithContext(error, { area: 'api.heatmap', operation: 'GET /api/heatmap' })
          logger.error('api.heatmap.failed', { error })
          return errorResponse('Failed to fetch station heatmap', 500)
        }
      },
    },
  },
})
