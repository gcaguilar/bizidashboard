import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { getDeveloperSession } from '@/lib/auth/developer-session'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { recordSecurityEvent } from '@/lib/security/audit'
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit'
import { RATE_LIMITS } from '@/lib/security/rate-limits'
import { revokeOwnApiClient } from '@/lib/security/api-clients'

const revokeRequestSchema = z.object({
  auth0ClientId: z.string().trim().min(1).max(200),
})

export const Route = createFileRoute('/api/developer/revoke/')({
  server: {
    handlers: {
      POST: async (opts) => {
        const request = opts.request
        const requestId = ''
        const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
        const userAgent = request.headers.get('user-agent') || ''

        const rateLimit = RATE_LIMITS.developer.register
        const rateLimitDecision = await consumeRateLimit({
          namespace: 'developer-revoke:ip',
          identifierParts: [clientIp],
          limit: rateLimit.limit,
          windowMs: rateLimit.windowMs,
        })
        const baseHeaders = { 'Content-Type': 'application/json', ...getRateLimitHeaders(rateLimitDecision) }

        if (!rateLimitDecision.allowed) {
          return new Response(JSON.stringify({ error: 'Too many revoke attempts' }), {
            status: 429,
            headers: { ...baseHeaders, 'Retry-After': String(rateLimitDecision.retryAfterSeconds) },
          })
        }

        const session = await getDeveloperSession()

        if (!session) {
          return new Response(JSON.stringify({ error: 'Login required to revoke an API client.' }), {
            status: 401,
            headers: baseHeaders,
          })
        }

        const body = await request.json().catch(() => null)
        const parsed = revokeRequestSchema.safeParse(body)

        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: 'Invalid request payload', details: parsed.error.flatten() }),
            { status: 400, headers: baseHeaders }
          )
        }

        try {
          const result = await revokeOwnApiClient(parsed.data.auth0ClientId, session.email)

          if (result === 'not_found') {
            return new Response(JSON.stringify({ error: 'No API client found with that client_id.' }), {
              status: 404,
              headers: baseHeaders,
            })
          }

          if (result === 'not_owner') {
            await recordSecurityEvent({
              eventType: 'auth_failed',
              route: '/api/developer/revoke',
              requestId,
              ip: clientIp,
              userAgent,
              outcome: 'denied',
              reasonCode: 'not_owner',
            })
            return new Response(JSON.stringify({ error: 'No API client found with that client_id.' }), {
              status: 404,
              headers: baseHeaders,
            })
          }

          await recordSecurityEvent({
            eventType: 'api_client_revoked',
            route: '/api/developer/revoke',
            requestId,
            ip: clientIp,
            userAgent,
            outcome: 'success',
          })

          return new Response(JSON.stringify({ revoked: true }), { status: 200, headers: baseHeaders })
        } catch (error) {
          captureExceptionWithContext(error, {
            area: 'api.developer-revoke',
            operation: 'POST /api/developer/revoke',
          })
          logger.error('api.developer_revoke.failed', { error })
          return new Response(JSON.stringify({ error: 'Failed to revoke API client' }), {
            status: 500,
            headers: baseHeaders,
          })
        }
      },
    },
  },
})
