import { createFileRoute } from '@tanstack/react-router'
import { fetchCachedStationsWithLatestStatus } from '@/lib/analytics-series'
import { OG_CARD_CACHE_CONTROL, buildFallbackOgCard, buildStationOgCard, svgResponse } from '@/lib/og-cards'
import { withPublicApiRoute } from '@/lib/security/public-api-route'

export const Route = createFileRoute('/api/og/station')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: '/api/og/station',
          routeGroup: 'api.og',
          namespace: 'public-og',
          limit: 60,
          windowMs: 60_000,
          requireApiKey: false,
          cacheControl: OG_CARD_CACHE_CONTROL,
        },
        async ({ request }) => {
          const stationId = new URL(request.url).searchParams.get('stationId')?.trim() ?? ''
          if (stationId.length === 0 || stationId.length > 64) {
            return new Response('Missing stationId', { status: 400 })
          }
          const stations = await fetchCachedStationsWithLatestStatus().catch(() => [])
          const station = stations.find((item) => item.id === stationId)
          return svgResponse(station ? buildStationOgCard(station) : buildFallbackOgCard())
        }
      ),
    },
  },
})
