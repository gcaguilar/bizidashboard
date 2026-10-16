import { createFileRoute } from '@tanstack/react-router'
import { getPipelineStatusSummary } from '@/services/shared-data'
import { resolveStatusDataState } from '@/lib/data-state'
import { csvResponse } from '@/lib/csv'
import { withPublicApiRoute } from '@/lib/security/public-api-route'

export const Route = createFileRoute('/api/status/')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: '/api/status',
          routeGroup: 'api.status',
          namespace: 'public-status',
          limit: 40,
          windowMs: 60_000,
          requireApiKey: false,
          cacheControl: 'public, max-age=60, stale-while-revalidate=60',
        },
        async ({ request }) => {
          const format = new URL(request.url).searchParams.get('format')
          const data = await getPipelineStatusSummary()
          if (!data || typeof data !== 'object') {
            throw new Error('Respuesta invalida al consultar el estado del sistema.')
          }

          const payload = { ...data, dataState: resolveStatusDataState(data) }

          if (format === 'csv') {
            return csvResponse({
              headers: ['timestamp', 'lastCollection', 'status'],
              rows: [[
                new Date().toISOString(),
                payload.pipeline?.lastSuccessfulPoll ?? '',
                payload.quality?.freshness?.lastUpdated ?? '',
              ]],
              filename: 'status.csv',
            })
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
