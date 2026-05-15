import { createFileRoute } from '@tanstack/react-router'
import { getStationPredictions } from '@/lib/predictions'
import { withPublicApiRoute } from '@/lib/security/public-api-route'

export const Route = createFileRoute('/api/predictions/')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: '/api/predictions',
          routeGroup: 'api.predictions',
          namespace: 'public-predictions',
          limit: 30,
          windowMs: 60_000,
          requireApiKey: false,
          cacheControl: 'public, max-age=60, stale-while-revalidate=60',
        },
        async ({ request, access }) => {
          const stationId = new URL(request.url).searchParams.get('stationId')?.trim() ?? ''

          if (!stationId || stationId.length < 1 || stationId.length > 64) {
            return new Response(JSON.stringify({ error: 'stationId must be 1-64 characters' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
          }

          const payload = await getStationPredictions(stationId)

          if (!payload) {
            return new Response(JSON.stringify({ error: 'station not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...access.headers } })
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
