import { createFileRoute } from '@tanstack/react-router'
import { getStationPatterns } from '@/analytics/queries/read'
import { withCache } from '@/lib/cache/cache'
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
        async ({ request, access }) => {
          const stationId = new URL(request.url).searchParams.get('stationId')
          if (!stationId || stationId.trim().length < 1 || stationId.trim().length > 64) {
            return new Response(JSON.stringify({ error: 'stationId query parameter is required (max 64 chars)' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
          }
          const patterns = await withCache(`patterns:stationId=${stationId}`, 300, () => getStationPatterns(stationId, undefined))
          return new Response(JSON.stringify(patterns), { status: 200, headers: { 'Content-Type': 'application/json', ...access.headers } })
        }
      ),
    },
  },
})
