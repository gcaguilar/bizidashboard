import { createFileRoute } from '@tanstack/react-router'
import { getHeatmap } from '@/analytics/queries/read'
import { isKnownStationId, withStationRollupCache } from '@/lib/analytics-series'
import { withPublicApiRoute } from '@/lib/security/public-api-route'

export const Route = createFileRoute('/api/heatmap/')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: '/api/heatmap',
          routeGroup: 'api.heatmap',
          namespace: 'public-heatmap',
          limit: 30,
          windowMs: 60_000,
          requireApiKey: false,
          cacheControl: 'public, max-age=300, stale-while-revalidate=600',
        },
        async ({ request }) => {
          const stationId = new URL(request.url).searchParams.get('stationId')?.trim() ?? ''
          if (stationId.length < 1 || stationId.length > 64) {
            return new Response(JSON.stringify({ error: 'stationId query parameter is required (max 64 chars)' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
          }
          const heatmap = (await isKnownStationId(stationId))
            ? await withStationRollupCache(`heatmap:stationId=${stationId}`, () => getHeatmap(stationId, undefined))
            : []
          return new Response(JSON.stringify(heatmap), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
      ),
    },
  },
})
