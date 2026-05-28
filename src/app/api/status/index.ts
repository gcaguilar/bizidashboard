import { createFileRoute } from '@tanstack/react-router'
import { getPipelineStatusSummary } from '@/services/shared-data'
import { resolveStatusDataState } from '@/lib/data-state'
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
        async ({ request, access }) => {
          const format = new URL(request.url).searchParams.get('format')
          const data = await getPipelineStatusSummary()
          if (!data || typeof data !== 'object') {
            throw new Error('Respuesta invalida al consultar el estado del sistema.')
          }

          const payload = { ...data, dataState: resolveStatusDataState(data) }

          if (format === 'csv') {
            const escapeCsv = (v: string) => v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
            const csv = 'timestamp,lastCollection,status\n'
              + escapeCsv(new Date().toISOString()) + ','
              + escapeCsv(payload.pipeline?.lastSuccessfulPoll ?? '') + ','
              + escapeCsv(payload.quality?.freshness?.lastUpdated ?? '')
            return new Response(csv, {
              status: 200,
              headers: { 'Content-Type': 'text/csv; charset=utf-8', ...access.headers },
            })
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
