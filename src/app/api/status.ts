import { createFileRoute } from '@tanstack/react-router'
import { getPipelineStatusSummary } from '@/services/shared-data'
import { withCache } from '@/lib/cache/cache'
import { resolveStatusDataState } from '@/lib/data-state'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { withApiRequest } from '@/lib/security/http'
import { enforcePublicApiAccess } from '@/lib/security/public-api'

async function statusHandler(input?: { request?: Request } | Request) {
  const request = input && typeof input === 'object' && 'request' in input ? input.request : input

  if (!request) {
    try {
      const payload = await withCache('status:current', 60, async () => {
        const data = await getPipelineStatusSummary()
        if (!data || typeof data !== 'object') {
          throw new Error('Respuesta invalida al consultar el estado del sistema.')
        }
        return {
          ...data,
          dataState: resolveStatusDataState(data),
        }
      })

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
        },
      })
    } catch (error) {
      captureExceptionWithContext(error, {
        area: 'api.status',
        operation: 'GET /api/status',
      })
      logger.error('api.status.failed', { error })
      return new Response(
        JSON.stringify({ error: 'Failed to fetch status', timestamp: new Date().toISOString(), dataState: 'error' }),
        { status: 500 }
      )
    }
  }

  return withApiRequest(
    request,
    { route: '/api/status', routeGroup: 'public.api' },
    async ({ requestId, clientIp, userAgent }) => {
      try {
        const format = new URL(request.url).searchParams.get('format')
        const access = await enforcePublicApiAccess({
          route: '/api/status',
          request,
          requestId,
          clientIp,
          userAgent,
          namespace: 'public-status',
          limit: 40,
          windowMs: 60_000,
          requireApiKey: false,
        })

        if (!access.ok) return access.response

        const payload = await withCache('status:current', 60, async () => {
          const data = await getPipelineStatusSummary()
          return { ...data, dataState: resolveStatusDataState(data) }
        })

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
        return new Response(JSON.stringify({ error: 'Failed to fetch status', dataState: 'error' }), { status: 500 })
      }
    }
  )
}

export const Route = createFileRoute('/api/status')({
  server: {
    handlers: {
      GET: statusHandler,
    },
  },
})

export const GET = statusHandler
