import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { requireDeveloperSession } from '@/lib/auth/developer-session'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { recordSecurityEvent } from '@/lib/security/audit'
import { getClientIp, rejectCrossOriginRequest } from '@/lib/security/http'
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit'
import { RATE_LIMITS } from '@/lib/security/rate-limits'
import {
  API_KEY_HEADER,
  createOwnApiKey,
  DEFAULT_RATE_LIMIT,
  DEFAULT_RATE_WINDOW_MS,
} from '@/lib/security/api-keys'

const registerRequestSchema = z.object({
  name: z.string().trim().min(2).max(100),
})

export const Route = createFileRoute('/api/developer/register/')({
  server: {
    handlers: {
      POST: async (opts) => {
        const request = opts.request
        const requestId = ''
        const clientIp = getClientIp(request.headers)
        const userAgent = request.headers.get('user-agent') || ''

        const originRejection = rejectCrossOriginRequest(request)
        if (originRejection) {
          return originRejection
        }

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

        const sessionResult = await requireDeveloperSession(baseHeaders)
        if ('response' in sessionResult) {
          return sessionResult.response
        }
        const { session } = sessionResult

        const body = await request.json().catch(() => null)
        const parsed = registerRequestSchema.safeParse(body)

        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: 'Invalid request payload', details: parsed.error.flatten() }),
            { status: 400, headers: baseHeaders }
          )
        }

        try {
          const result = await createOwnApiKey(parsed.data.name, session.email)

          if (result.status === 'limit_reached') {
            return new Response(
              JSON.stringify({
                error: `You already have ${result.limit} active API keys. Revoke one before creating another.`,
              }),
              { status: 409, headers: baseHeaders }
            )
          }

          await recordSecurityEvent({
            eventType: 'api_key_created',
            route: '/api/developer/register',
            requestId,
            ip: clientIp,
            userAgent,
            outcome: 'success',
          })

          return new Response(
            JSON.stringify({
              apiKey: result.fullKey,
              keyId: result.info.id,
              name: result.info.name,
              keyPrefix: result.info.keyPrefix,
              createdAt: result.info.createdAt,
              header: API_KEY_HEADER,
              rateLimit: {
                limit: result.info.customRateLimit ?? DEFAULT_RATE_LIMIT,
                windowMs: result.info.customRateWindow ?? DEFAULT_RATE_WINDOW_MS,
              },
              message: 'Store the apiKey now — it will not be shown again.',
            }),
            { status: 201, headers: baseHeaders }
          )
        } catch (error) {
          captureExceptionWithContext(error, {
            area: 'api.developer-register',
            operation: 'POST /api/developer/register',
          })
          logger.error('api.developer_register.failed', { error })
          return new Response(JSON.stringify({ error: 'Failed to create API key' }), {
            status: 500,
            headers: baseHeaders,
          })
        }
      },
    },
  },
})
