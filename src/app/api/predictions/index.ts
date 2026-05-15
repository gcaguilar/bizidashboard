import { createFileRoute } from '@tanstack/react-router'
import { getStationPredictions } from '@/lib/predictions'
import { errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { enforcePublicApiAccess } from '@/lib/security/public-api'

const PUBLIC_ROUTE_RATE_LIMIT = {
  limit: 30,
  windowMs: 60_000,
}

export const Route = createFileRoute('/api/predictions/')({
  server: {
    handlers: {
      GET: async (opts) => {
        const request = opts.request
        try {
          const stationId = new URL(request.url).searchParams.get('stationId')?.trim() ?? ''

          if (!stationId || stationId.length < 1 || stationId.length > 64) {
            return new Response(JSON.stringify({ error: 'stationId must be 1-64 characters' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
          }

          const access = await enforcePublicApiAccess({
            route: '/api/predictions',
            request,
            requestId: '',
            clientIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
            userAgent: request.headers.get('user-agent') || '',
            namespace: 'public-predictions',
            limit: PUBLIC_ROUTE_RATE_LIMIT.limit,
            windowMs: PUBLIC_ROUTE_RATE_LIMIT.windowMs,
            requireApiKey: false,
          })

          if (!access.ok) return access.response

          const payload = await getStationPredictions(stationId)

          if (!payload) {
            return new Response(JSON.stringify({ error: 'station not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...access.headers } })
          }

          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60, stale-while-revalidate=60', ...access.headers },
          })
        } catch (error) {
          captureExceptionWithContext(error, { area: 'api.predictions', operation: 'GET /api/predictions' })
          logger.error('api.predictions.failed', { error })
          return errorResponse('Failed to generate predictions', 500)
        }
      },
    },
  },
})
