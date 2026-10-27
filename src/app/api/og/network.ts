import { createFileRoute } from '@tanstack/react-router'
import { fetchCachedStationsWithLatestStatus } from '@/lib/analytics-series'
import { OG_CARD_CACHE_CONTROL, buildFallbackOgCard, buildNetworkOgCard, svgResponse } from '@/lib/og-cards'
import { withPublicApiRoute } from '@/lib/security/public-api-route'

export const Route = createFileRoute('/api/og/network')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: '/api/og/network',
          routeGroup: 'api.og',
          namespace: 'public-og',
          limit: 60,
          windowMs: 60_000,
          requireApiKey: false,
          cacheControl: OG_CARD_CACHE_CONTROL,
        },
        async () => {
          const stations = await fetchCachedStationsWithLatestStatus().catch(() => [])
          return svgResponse(stations.length > 0 ? buildNetworkOgCard(stations) : buildFallbackOgCard())
        }
      ),
    },
  },
})
