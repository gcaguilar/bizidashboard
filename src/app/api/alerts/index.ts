import { createFileRoute } from '@tanstack/react-router'
import { getActiveAlerts } from '@/analytics/queries/read'
import { withPublicApiRoute } from '@/lib/security/public-api-route'

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
        async ({ request, access }) => {
          const limitParam = parseInt(new URL(request.url).searchParams.get('limit') ?? '50')
          const limit = Math.min(Math.max(1, limitParam), 200)

          const alerts = await getActiveAlerts(limit)
          const payload = { limit, alerts, generatedAt: new Date().toISOString() }

          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...access.headers },
          })
        }
      ),
    },
  },
})
