import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { issueRefreshToken, hashPublicKey, hashToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { recordSecurityEvent } from '@/lib/security/audit'
import { buildMobileCorsHeaders, rejectDisallowedMobileOrigin } from '@/lib/security/http'
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit'

const REGISTER_RATE_LIMIT = { limit: 10, windowMs: 5 * 60 * 1000 }

const installRegisterSchema = z.object({
  platform: z.enum(['ios', 'android']),
  appVersion: z.string().trim().min(1).max(256),
  osVersion: z.string().trim().min(1).max(256),
  publicKey: z.string().trim().min(40).max(2048).regex(/^[A-Za-z0-9+/=]+$/),
})

export const Route = createFileRoute('/api/install/register/')({
  server: {
    handlers: {
      POST: async (opts) => {
        const request = opts.request
        try {
          const requestId = ''
          const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
          const userAgent = request.headers.get('user-agent') || ''

          const originRejection = rejectDisallowedMobileOrigin(request)
          if (originRejection) return originRejection

          const body = await request.json().catch(() => null)
          const parsed = installRegisterSchema.safeParse(body)
          const publicKeyFingerprint = parsed.success ? hashPublicKey(parsed.data.publicKey) : 'invalid-body'

          const [ipDecision, deviceDecision] = await Promise.all([
            consumeRateLimit({ namespace: 'install-register:ip', identifierParts: [clientIp], limit: REGISTER_RATE_LIMIT.limit, windowMs: REGISTER_RATE_LIMIT.windowMs }),
            consumeRateLimit({ namespace: 'install-register:device', identifierParts: [publicKeyFingerprint], limit: REGISTER_RATE_LIMIT.limit, windowMs: REGISTER_RATE_LIMIT.windowMs }),
          ])
          const rateLimitDecision = !ipDecision.allowed ? ipDecision : deviceDecision
          const baseHeaders = { ...buildMobileCorsHeaders(request), ...getRateLimitHeaders(rateLimitDecision) }

          if (!rateLimitDecision.allowed) {
            await recordSecurityEvent({ eventType: 'rate_limit_exceeded', route: '/api/install/register', requestId, ip: clientIp, userAgent, outcome: 'denied', reasonCode: 'rate_limit', metadata: { publicKeyFingerprint } })
            return new Response(JSON.stringify({ error: 'Too many installation registration attempts' }), { status: 429, headers: { 'Content-Type': 'application/json', ...baseHeaders, 'Retry-After': String(rateLimitDecision.retryAfterSeconds) } })
          }
          if (!parsed.success) {
            await recordSecurityEvent({ eventType: 'auth_failed', route: '/api/install/register', requestId, ip: clientIp, userAgent, outcome: 'denied', reasonCode: 'validation_failed' })
            return new Response(JSON.stringify({ error: 'Invalid request payload', details: parsed.error.flatten() }), { status: 400, headers: { 'Content-Type': 'application/json', ...baseHeaders } })
          }

          const installId = randomUUID()
          const issuedRefreshToken = await issueRefreshToken(installId)

          const install = await prisma.install.upsert({
            where: { publicKeyFingerprint },
            create: {
              installId, platform: parsed.data.platform, appVersion: parsed.data.appVersion, osVersion: parsed.data.osVersion,
              publicKey: hashPublicKey(parsed.data.publicKey), publicKeyFingerprint, refreshTokenHash: hashToken(issuedRefreshToken.token),
              refreshTokenIssuedAt: issuedRefreshToken.issuedAt, lastSeenAt: issuedRefreshToken.issuedAt, lastAuthAt: issuedRefreshToken.issuedAt, isActive: true,
            },
            update: {
              lastSeenAt: issuedRefreshToken.issuedAt,
              refreshTokenHash: hashToken(issuedRefreshToken.token),
              refreshTokenIssuedAt: issuedRefreshToken.issuedAt,
              isActive: true,
            },
          });

          const isNew = install.installId === installId
          await recordSecurityEvent({
            eventType: isNew ? 'install_registered' : 'install_reregistered',
            route: '/api/install/register', requestId, installId: install.installId, ip: clientIp, userAgent,
            outcome: 'success', metadata: { platform: parsed.data.platform, ...(isNew ? { appVersion: parsed.data.appVersion } : {}) }
          });
          return new Response(JSON.stringify({ installId: install.installId, refreshToken: issuedRefreshToken.token }), {
            status: isNew ? 201 : 200, headers: { 'Content-Type': 'application/json', ...baseHeaders },
          })
        } catch (error) {
          captureExceptionWithContext(error, { area: 'api.install-register', operation: 'POST /api/install/register' })
          logger.error('api.install_register.failed', { error })
          return new Response(JSON.stringify({ error: 'Failed to register installation' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
        }
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      OPTIONS: async (opts) => {
        const request = opts.request
        const rejection = rejectDisallowedMobileOrigin(request)
        if (rejection) return rejection
        return new Response(null, { status: 204, headers: buildMobileCorsHeaders(request) })
      },
    },
  },
})
