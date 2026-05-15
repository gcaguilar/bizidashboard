import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/mobility/')({
  server: {
    handlers: {
      // eslint-disable-next-line @typescript-eslint/require-await
      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url)
        const mobilityDays = Number(searchParams.get('mobilityDays')) || 14
        const demandDays = Number(searchParams.get('demandDays')) || 30
        const monthKey = searchParams.get('month')

        return new Response(
          JSON.stringify({
            mobilityDays,
            demandDays,
            selectedMonth: monthKey,
            methodology:
              'Matriz O-D estimada con variaciones netas horarias de bicis por estacion; no representa viajes individuales observados.',
            hourlySignals: [],
            dailyDemand: [],
            systemHourlyProfile: [],
            generatedAt: new Date().toISOString(),
            dataState: 'empty',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=300, stale-while-revalidate=120',
            },
          }
        )
      },
    },
  },
})
