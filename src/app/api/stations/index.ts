import { createFileRoute } from '@tanstack/react-router'
import { getStationsWithLatestStatus } from '@/analytics/queries/read'
import { rowsToCsv } from '@/lib/csv'
import { resolveStationsDataState } from '@/lib/data-state'
import { withPublicApiRoute } from '@/lib/security/public-api-route'
import { getSharedDatasetSnapshot } from '@/services/shared-data'

export const Route = createFileRoute('/api/stations/')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: '/api/stations',
          routeGroup: 'api.stations',
          namespace: 'public-stations',
          limit: 40,
          windowMs: 60_000,
          requireApiKey: false,
          cacheControl: 'public, max-age=60, stale-while-revalidate=60',
        },
        async ({ request, access }) => {
          const format = new URL(request.url).searchParams.get('format')

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
                ...access.headers,
              },
            })
          }

          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...access.headers },
          })
        }
      ),
    },
  },
})
