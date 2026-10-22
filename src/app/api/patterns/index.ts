import { createFileRoute } from '@tanstack/react-router'
import { getStationPatterns } from '@/analytics/queries/read'
import { isKnownStationId, withStationRollupCache } from '@/lib/analytics-series'
import { withPublicApiRoute } from '@/lib/security/public-api-route'

export const Route = createFileRoute('/api/patterns/')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: '/api/patterns',
          routeGroup: 'api.patterns',
          namespace: 'public-patterns',
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
          const patterns = (await isKnownStationId(stationId))
            ? await withStationRollupCache(`patterns:stationId=${stationId}`, () => getStationPatterns(stationId, undefined))
            : []
          return new Response(JSON.stringify(patterns), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
      ),
    },
  },
})
