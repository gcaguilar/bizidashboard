import { NextRequest, NextResponse } from 'next/server'
import { getHeatmap } from '@/analytics/queries/read'
import { withCache } from '@/lib/cache/cache'
import { errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { withApiRequest } from '@/lib/security/http'
import { enforcePublicApiAccess } from '@/lib/security/public-api'

export const dynamic = 'force-dynamic'
const PUBLIC_ROUTE_RATE_LIMIT = {
  limit: 30,
  windowMs: 60_000
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withApiRequest(
    request,
    {
      route: '/api/heatmap',
      routeGroup: 'public.api',
    },
    async ({ requestId, clientIp, userAgent }) => {
      const { searchParams } = new URL(request.url)
      const stationId = searchParams.get('stationId')

      if (!stationId) {
        return NextResponse.json(
          { error: 'stationId query parameter is required' },
          { status: 400 }
        )
      }

      const access = await enforcePublicApiAccess({
        route: '/api/heatmap',
        request,
        requestId,
        clientIp,
        userAgent,
        namespace: 'public-heatmap',
        limit: PUBLIC_ROUTE_RATE_LIMIT.limit,
        windowMs: PUBLIC_ROUTE_RATE_LIMIT.windowMs,
        requireApiKey: false,
      })

      if (!access.ok) {
        return access.response
      }

      try {
        const cacheKey = `heatmap:stationId=${stationId}`
        const heatmap = await withCache(cacheKey, 300, () =>
          getHeatmap(stationId)
        )

        return NextResponse.json(heatmap, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
            ...access.headers,
          }
        })
      } catch (error) {
        captureExceptionWithContext(error, {
          area: 'api.heatmap',
          operation: 'GET /api/heatmap',
          extra: { stationId },
        })
        logger.error('api.heatmap.failed', { error })

        return errorResponse('Failed to fetch station heatmap', 500)
      }
    }
  )
}
