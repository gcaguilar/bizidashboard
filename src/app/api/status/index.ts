import { createFileRoute } from '@tanstack/react-router'
import { getPipelineStatusSummary } from '@/services/shared-data'
import { resolveStatusDataState } from '@/lib/data-state'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { enforcePublicApiAccess } from '@/lib/security/public-api'

export const Route = createFileRoute('/api/status/')({
  server: {
    handlers: {
      GET: async (opts) => {
        const request = opts.request
        try {
          const format = new URL(request.url).searchParams.get('format')
          const access = await enforcePublicApiAccess({
            route: '/api/status',
            request,
            requestId: '',
            clientIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
            userAgent: request.headers.get('user-agent') || '',
            namespace: 'public-status',
            limit: 40,
            windowMs: 60_000,
            requireApiKey: false,
          })
          if (!access.ok) return access.response

          const data = await getPipelineStatusSummary()
          if (!data || typeof data !== 'object') {
            throw new Error('Respuesta invalida al consultar el estado del sistema.')
          }

          const payload = { ...data, dataState: resolveStatusDataState(data) }

          if (format === 'csv') {
            const csv = 'timestamp,lastCollection,status\n' + (payload.pipeline?.lastSuccessfulPoll || '') + ',' + (payload.pipeline?.lastSuccessfulPoll || '') + ',' + (payload.quality?.freshness?.lastUpdated || '')
            return new Response(csv, {
              status: 200,
              headers: { 'Content-Type': 'text/csv; charset=utf-8', ...access.headers },
            })
          }

          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60, stale-while-revalidate=60', ...access.headers },
          })
        } catch (error) {
          captureExceptionWithContext(error, { area: 'api.status', operation: 'GET /api/status' })
          logger.error('api.status.failed', { error })
          return new Response(JSON.stringify({ error: 'Failed to fetch status', dataState: 'error' }), { status: 500 })
        }
      },
    },
  },
})
