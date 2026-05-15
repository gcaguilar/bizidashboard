import { createFileRoute } from '@tanstack/react-router'
import { getStationsWithLatestStatus } from '@/analytics/queries/read'
import { rowsToCsv } from '@/lib/csv'
import { errorResponse } from '@/lib/api-response'
import { resolveStationsDataState } from '@/lib/data-state'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { withApiRequest } from '@/lib/security/http'
import { enforcePublicApiAccess } from '@/lib/security/public-api'
import { getSharedDatasetSnapshot } from '@/services/shared-data'
import { withCache } from '@/lib/cache/cache'

async function stationsHandler(input?: { request?: Request } | Request) {
  const request = input && typeof input === 'object' && 'request' in input ? input.request : input

  if (!request) {
    try {
      const payload = await withCache('stations:current', 60, async () => {
        const [stations, dataset] = await Promise.all([
          getStationsWithLatestStatus(),
          getSharedDatasetSnapshot().catch(() => null),
        ])
        return {
          stations,
          generatedAt: new Date().toISOString(),
          dataState: resolveStationsDataState({
            count: stations.length,
            coverage: dataset?.coverage,
            status: dataset?.pipeline,
          }),
        }
      })

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
        },
      })
    } catch (error) {
      captureExceptionWithContext(error, {
        area: 'api.stations',
        operation: 'GET /api/stations',
      })
      logger.error('api.stations.failed', { error })
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch stations',
          timestamp: new Date().toISOString(),
          dataState: 'error',
        }),
        { status: 500 }
      )
    }
  }

  return withApiRequest(
    request,
    {
      route: '/api/stations',
      routeGroup: 'public.api',
    },
    async ({ requestId, clientIp, userAgent }) => {
      try {
        const format = new URL(request.url).searchParams.get('format')
        const access = await enforcePublicApiAccess({
          route: '/api/stations',
          request,
          requestId,
          clientIp,
          userAgent,
          namespace: 'public-stations',
          limit: 40,
          windowMs: 60_000,
          requireApiKey: false,
        })

        if (!access.ok) {
          return access.response
        }
        const [stations, dataset] = await Promise.all([
          getStationsWithLatestStatus(),
          getSharedDatasetSnapshot().catch(() => null),
        ])
        const payload = {
          stations,
          generatedAt: new Date().toISOString(),
          dataState: resolveStationsDataState({
            count: stations.length,
            coverage: dataset?.coverage,
            status: dataset?.pipeline,
          }),
        }

        if (format === 'csv') {
          const csv = rowsToCsv(
            ['stationId', 'stationName', 'lat', 'lon', 'capacity', 'bikesAvailable', 'anchorsFree', 'recordedAt'],
            payload.stations
          )
          return new Response(csv, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': 'attachment; filename="stations-current.csv"',
              'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
              ...access.headers,
            },
          })
        }

        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
            ...access.headers,
          },
        })
      } catch (error) {
        captureExceptionWithContext(error, {
          area: 'api.stations',
          operation: 'GET /api/stations',
        })
        logger.error('api.stations.failed', { error })
        return errorResponse('Failed to fetch stations', 500)
      }
    }
  )
}

export const Route = createFileRoute('/api/stations')({
  server: {
    handlers: {
      GET: stationsHandler,
    },
  },
})

export const GET = stationsHandler
