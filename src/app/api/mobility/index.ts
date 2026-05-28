import { createFileRoute } from '@tanstack/react-router'
import { withPublicApiRoute } from '@/lib/security/public-api-route'
import { getMobilityData } from '@/lib/mobility-read-model'

export const Route = createFileRoute('/api/mobility/')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: '/api/mobility',
          routeGroup: 'api.mobility',
          namespace: 'public-mobility',
          limit: 30,
          windowMs: 60_000,
          requireApiKey: false,
          cacheControl: 'public, max-age=300, stale-while-revalidate=120',
        },
        async ({ request }) => {
          const { searchParams } = new URL(request.url)
          const mobilityDays = Math.min(Math.max(1, Number(searchParams.get('mobilityDays')) || 14), 365)
          const demandDays = Math.min(Math.max(1, Number(searchParams.get('demandDays')) || 30), 365)
          const monthKeyRaw = searchParams.get('month')
          const monthKey = monthKeyRaw && /^\d{4}-\d{2}$/.test(monthKeyRaw) ? monthKeyRaw : undefined

          const payload = await getMobilityData({
            mobilityDays,
            demandDays,
            monthKey,
          })

          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          })
        }
      ),
    },
  },
})
