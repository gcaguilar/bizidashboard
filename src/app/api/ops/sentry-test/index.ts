import { randomUUID } from 'node:crypto'
import * as Sentry from '@sentry/tanstackstart-react'
import { createFileRoute } from '@tanstack/react-router'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { enforceOperationalAccess } from '@/lib/security/ops-api'

const RATE_LIMIT_MAX = 6
const RATE_LIMIT_WINDOW_MS = 60_000

function resolveSentryDsnSource(): 'SENTRY_DSN' | 'NEXT_PUBLIC_SENTRY_DSN' | null {
  if (process.env.SENTRY_DSN?.trim()) return 'SENTRY_DSN'
  if (process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) return 'NEXT_PUBLIC_SENTRY_DSN'
  return null
}

export const Route = createFileRoute('/api/ops/sentry-test/')({
  server: {
    handlers: {
      POST: async (opts) => {
        const request = opts.request
        try {
          const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
          const access = await enforceOperationalAccess({
            request, clientIp, namespace: 'ops-sentry-test', limit: RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW_MS,
            unauthorizedError: 'Unauthorized Sentry test trigger.',
            rateLimitError: 'Too many requests for /api/ops/sentry-test.',
            misconfiguredError: 'Server misconfigured: OPS_API_KEY or COLLECT_API_KEY is required.',
          })
          if ('response' in access) return access.response

          const dsnSource = resolveSentryDsnSource()
          if (!dsnSource) {
            return new Response(JSON.stringify({ success: false, error: 'Sentry DSN is not configured on the server runtime.', timestamp: new Date().toISOString() }), { status: 503, headers: { 'Content-Type': 'application/json', ...access.headers, 'Cache-Control': 'no-store' } })
          }

          const marker = randomUUID()
          const eventId = captureExceptionWithContext(new Error(`Manual Sentry probe from /api/ops/sentry-test (${marker})`), { area: 'api.ops.sentry-test', operation: 'POST /api/ops/sentry-test', extra: { marker, dsnSource } })
          const flushed = await Sentry.flush(2_000)

          logger.warn('api.ops.sentry_test.triggered', { eventId, flushed, dsnSource })
          return new Response(JSON.stringify({ success: true, eventId, flushed, marker, dsnSource, timestamp: new Date().toISOString() }), { status: 202, headers: { 'Content-Type': 'application/json', ...access.headers, 'Cache-Control': 'no-store' } })
        } catch (error) {
          captureExceptionWithContext(error, { area: 'api.ops.sentry-test', operation: 'POST /api/ops/sentry-test' })
          return new Response(JSON.stringify({ success: false, error: 'Sentry test failed', timestamp: new Date().toISOString() }), { status: 500, headers: { 'Content-Type': 'application/json' } })
        }
      },
    },
  },
})
