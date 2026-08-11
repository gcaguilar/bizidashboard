import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { getDeveloperSession, isDeveloperSessionConfigured } from '@/lib/auth/developer-session'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { recordSecurityEvent } from '@/lib/security/audit'
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit'
import { RATE_LIMITS } from '@/lib/security/rate-limits'
import { createApiClient } from '@/lib/security/api-clients'

const registerRequestSchema = z.object({
  name: z.string().trim().min(2).max(100),
})

export const Route = createFileRoute('/api/developer/register/')({
  server: {
    handlers: {
      POST: async (opts) => {
        const request = opts.request
        const requestId = ''
        const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
        const userAgent = request.headers.get('user-agent') || ''

        const rateLimit = RATE_LIMITS.developer.register
        const rateLimitDecision = await consumeRateLimit({
          namespace: 'developer-register:ip',
          identifierParts: [clientIp],
          limit: rateLimit.limit,
          windowMs: rateLimit.windowMs,
        })
        const baseHeaders = { 'Content-Type': 'application/json', ...getRateLimitHeaders(rateLimitDecision) }

        if (!rateLimitDecision.allowed) {
          await recordSecurityEvent({
            eventType: 'rate_limit_exceeded',
            route: '/api/developer/register',
            requestId,
            ip: clientIp,
            userAgent,
            outcome: 'denied',
            reasonCode: 'rate_limit',
          })
          return new Response(JSON.stringify({ error: 'Too many registration attempts' }), {
            status: 429,
            headers: { ...baseHeaders, 'Retry-After': String(rateLimitDecision.retryAfterSeconds) },
          })
        }

        if (!isDeveloperSessionConfigured()) {
          return new Response(JSON.stringify({ error: 'Developer login is not configured.' }), {
            status: 503,
            headers: baseHeaders,
          })
        }

        const session = await getDeveloperSession()

        if (!session) {
          return new Response(JSON.stringify({ error: 'Login required to register an API client.' }), {
            status: 401,
            headers: baseHeaders,
          })
        }

        const body = await request.json().catch(() => null)
        const parsed = registerRequestSchema.safeParse(body)

        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: 'Invalid request payload', details: parsed.error.flatten() }),
            { status: 400, headers: baseHeaders }
          )
        }

        try {
          const { clientId, clientSecret } = await createApiClient({
            name: parsed.data.name,
            ownerEmail: session.email,
          })

          await recordSecurityEvent({
            eventType: 'api_client_registered',
            route: '/api/developer/register',
            requestId,
            ip: clientIp,
            userAgent,
            outcome: 'success',
          })

          return new Response(
            JSON.stringify({
              clientId,
              clientSecret,
              tokenUrl: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
              audience: process.env.AUTH0_AUDIENCE,
              message: 'Store the clientSecret now — it will not be shown again.',
            }),
            { status: 201, headers: baseHeaders }
          )
        } catch (error) {
          captureExceptionWithContext(error, {
            area: 'api.developer-register',
            operation: 'POST /api/developer/register',
          })
          logger.error('api.developer_register.failed', { error })
          return new Response(JSON.stringify({ error: 'Failed to register API client' }), {
            status: 500,
            headers: baseHeaders,
          })
        }
      },
    },
  },
})
