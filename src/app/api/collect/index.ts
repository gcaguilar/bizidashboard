import { createFileRoute } from '@tanstack/react-router'
import { getJobState, isCollectionScheduled, runCollection } from '@/jobs/bizi-collection'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { recordSecurityEvent } from '@/lib/security/audit'
import { enforceOperationalAccess } from '@/lib/security/ops-api'

const DEFAULT_RATE_LIMIT_MAX = 6
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

function getRateLimitConfig(): { max: number; windowMs: number } {
  return {
    max: readPositiveInteger(process.env.COLLECT_RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX),
    windowMs: readPositiveInteger(process.env.COLLECT_RATE_LIMIT_WINDOW_MS, DEFAULT_RATE_LIMIT_WINDOW_MS),
  }
}

export const Route = createFileRoute('/api/collect/')({
  server: {
    handlers: {
      POST: async (opts) => {
        const request = opts.request
        try {
          const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
          const userAgent = request.headers.get('user-agent') || ''

          const { max, windowMs } = getRateLimitConfig()
          const access = await enforceOperationalAccess({
            request,
            clientIp,
            namespace: 'collect',
            limit: max,
            windowMs,
            unauthorizedError: 'Unauthorized collect trigger.',
            rateLimitError: 'Too many requests for /api/collect.',
            misconfiguredError: 'Server misconfigured: OPS_API_KEY or COLLECT_API_KEY is required.',
          })

          if ('response' in access) {
            const status = access.response.status
            const eventType = status === 429 ? 'rate_limit_exceeded' : status === 401 ? 'auth_failed' : 'ops_unavailable'
            await recordSecurityEvent({
              eventType,
              route: '/api/collect',
              requestId: '',
              ip: clientIp,
              userAgent,
              outcome: status === 429 ? 'denied' : 'error',
              reasonCode: access.response.statusText || String(status),
            })
            return access.response
          }

          const result = await runCollection({ trigger: 'manual', requestId: '' })

          await recordSecurityEvent({
            eventType: 'manual_collect_triggered',
            route: '/api/collect',
            requestId: '',
            collectionId: result.collectionId,
            ip: clientIp,
            userAgent,
            outcome: result.success ? 'success' : 'error',
            metadata: { stationCount: result.stationCount, durationMs: result.duration },
          })

          if (!result.success) {
            return new Response(JSON.stringify({ success: false, error: result.error ?? 'Collection failed', collectionId: result.collectionId, timestamp: new Date().toISOString() }), { status: 500, headers: { 'Content-Type': 'application/json', ...access.headers } })
          }

          return new Response(JSON.stringify({ success: true, collectionId: result.collectionId, stationCount: result.stationCount, recordedAt: toIsoString(result.recordedAt), quality: result.quality, duration: result.duration, warnings: result.warnings, timestamp: result.timestamp.toISOString() }), { status: 200, headers: { 'Content-Type': 'application/json', ...access.headers } })
        } catch (error) {
          captureExceptionWithContext(error, { area: 'api.collect', operation: 'POST /api/collect' })
          logger.error('api.collect.post_failed', { error })
          return new Response(JSON.stringify({ success: false, error: 'Collection failed', timestamp: new Date().toISOString() }), { status: 500, headers: { 'Content-Type': 'application/json' } })
        }
      },

      GET: async (opts) => {
        const request = opts.request
        try {
          const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
          const userAgent = request.headers.get('user-agent') || ''

          const { max, windowMs } = getRateLimitConfig()
          const access = await enforceOperationalAccess({
            request,
            clientIp,
            namespace: 'collect',
            limit: max,
            windowMs,
            unauthorizedError: 'Unauthorized collect trigger.',
            rateLimitError: 'Too many requests for /api/collect.',
            misconfiguredError: 'Server misconfigured: OPS_API_KEY or COLLECT_API_KEY is required.',
          })

          if ('response' in access) {
            await recordSecurityEvent({
              eventType: access.response.status === 429 ? 'rate_limit_exceeded' : 'auth_failed',
              route: '/api/collect',
              requestId: '',
              ip: clientIp,
              userAgent,
              outcome: 'denied',
              reasonCode: String(access.response.status),
            })
            return access.response
          }

          const state = getJobState()
          return new Response(JSON.stringify({ lastSuccess: toIsoString(state.lastSuccess), isScheduled: isCollectionScheduled() }), { status: 200, headers: { 'Content-Type': 'application/json', ...access.headers } })
        } catch (error) {
          captureExceptionWithContext(error, { area: 'api.collect', operation: 'GET /api/collect' })
          logger.error('api.collect.get_failed', { error })
          return new Response(JSON.stringify({ error: 'Failed to query collect state', timestamp: new Date().toISOString() }), { status: 500, headers: { 'Content-Type': 'application/json' } })
        }
      },
    },
  },
})
