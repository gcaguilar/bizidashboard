import { createFileRoute } from '@tanstack/react-router'
import { getJobState, isCollectionScheduled, runCollection } from '@/jobs/bizi-collection'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { recordSecurityEvent } from '@/lib/security/audit'
import { handleOperationalRoute } from '@/lib/security/ops-api'

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

function getAccessOptions() {
  return {
    route: '/api/collect',
    namespace: 'collect',
    limit: readPositiveInteger(process.env.COLLECT_RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX),
    windowMs: readPositiveInteger(process.env.COLLECT_RATE_LIMIT_WINDOW_MS, DEFAULT_RATE_LIMIT_WINDOW_MS),
    unauthorizedError: 'Unauthorized collect trigger.',
    rateLimitError: 'Too many requests for /api/collect.',
    misconfiguredError: 'Server misconfigured: OPS_API_KEY or COLLECT_API_KEY is required.',
  }
}

export const Route = createFileRoute('/api/collect/')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          return await handleOperationalRoute(request, getAccessOptions(), async ({ clientIp, userAgent, headers }) => {
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
              return new Response(JSON.stringify({ success: false, error: result.error ?? 'Collection failed', collectionId: result.collectionId, timestamp: new Date().toISOString() }), { status: 500, headers: { 'Content-Type': 'application/json', ...headers } })
            }

            return new Response(JSON.stringify({ success: true, collectionId: result.collectionId, stationCount: result.stationCount, recordedAt: toIsoString(result.recordedAt), quality: result.quality, duration: result.duration, warnings: result.warnings, timestamp: result.timestamp.toISOString() }), { status: 200, headers: { 'Content-Type': 'application/json', ...headers } })
          })
        } catch (error) {
          captureExceptionWithContext(error, { area: 'api.collect', operation: 'POST /api/collect' })
          logger.error('api.collect.post_failed', { error })
          return new Response(JSON.stringify({ success: false, error: 'Collection failed', timestamp: new Date().toISOString() }), { status: 500, headers: { 'Content-Type': 'application/json' } })
        }
      },

      GET: async ({ request }) => {
        try {
          return await handleOperationalRoute(request, getAccessOptions(), async ({ headers }) => {
            const state = getJobState()
            return new Response(JSON.stringify({ lastSuccess: toIsoString(state.lastSuccess), isScheduled: isCollectionScheduled() }), { status: 200, headers: { 'Content-Type': 'application/json', ...headers } })
          })
        } catch (error) {
          captureExceptionWithContext(error, { area: 'api.collect', operation: 'GET /api/collect' })
          logger.error('api.collect.get_failed', { error })
          return new Response(JSON.stringify({ error: 'Failed to query collect state', timestamp: new Date().toISOString() }), { status: 500, headers: { 'Content-Type': 'application/json' } })
        }
      },
    },
  },
})
