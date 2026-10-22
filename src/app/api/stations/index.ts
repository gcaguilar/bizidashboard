import { createFileRoute } from '@tanstack/react-router'
import { fetchCachedStationsWithLatestStatus } from '@/lib/analytics-series'
import { csvResponse } from '@/lib/csv'
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
        async ({ request }) => {
          const format = new URL(request.url).searchParams.get('format')

          const [stations, dataset] = await Promise.all([
            fetchCachedStationsWithLatestStatus().catch(() => []),
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
            return csvResponse({
              headers: ['stationId', 'stationName', 'lat', 'lon', 'capacity', 'bikesAvailable', 'anchorsFree', 'recordedAt'],
              rows: payload.stations.map((station) => ({
                stationId: station.id,
                stationName: station.name,
                lat: station.lat,
                lon: station.lon,
                capacity: station.capacity,
                bikesAvailable: station.bikesAvailable,
                anchorsFree: station.anchorsFree,
                recordedAt: (station.recordedAt as unknown as Date) instanceof Date
                  ? (station.recordedAt as unknown as Date).toISOString()
                  : station.recordedAt,
              })),
              filename: 'stations-current.csv',
            })
          }

          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      ),
    },
  },
})
