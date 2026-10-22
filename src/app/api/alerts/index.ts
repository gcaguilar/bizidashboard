import { createFileRoute } from '@tanstack/react-router'
import { getActiveAlerts } from '@/analytics/queries/read'
import { withCache } from '@/lib/cache/cache'
import { withPublicApiRoute } from '@/lib/security/public-api-route'

/**
 * Se cachea el lote máximo y se recorta al límite pedido (el mismo patrón
 * que `/api/history` con `days`): límites distintos comparten cache.
 */
const ALERTS_BASE_LIMIT = 200
const ALERTS_CACHE_TTL_SECONDS = 60

export const Route = createFileRoute('/api/alerts/')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: '/api/alerts',
          routeGroup: 'api.alerts',
          namespace: 'public-alerts',
          limit: 40,
          windowMs: 60_000,
          requireApiKey: false,
          cacheControl: 'public, max-age=300, stale-while-revalidate=300',
        },
        async ({ request }) => {
          const limitParam = parseInt(new URL(request.url).searchParams.get('limit') ?? '50')
          const limit = Math.min(Math.max(1, limitParam), 200)

          const base = await withCache(
            `alerts:active:limit=${ALERTS_BASE_LIMIT}`,
            ALERTS_CACHE_TTL_SECONDS,
            async () => ({
              alerts: await getActiveAlerts(ALERTS_BASE_LIMIT),
              generatedAt: new Date().toISOString(),
            })
          )

          const payload = {
            limit,
            alerts: base.alerts.slice(0, limit),
            generatedAt: base.generatedAt,
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
