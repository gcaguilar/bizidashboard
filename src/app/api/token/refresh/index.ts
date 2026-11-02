import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { generateAccessToken, hashToken, issueRefreshToken, verifyRefreshToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { recordSecurityEvent } from '@/lib/security/audit'
import { applyMobileCors, buildMobileCorsHeaders, getClientIp, handleMobilePreflight, rejectDisallowedMobileOrigin } from '@/lib/security/http'
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit'
import { decryptTokenValue, encryptTokenValue } from '@/lib/auth/token-vault'

const ACCESS_TOKEN_EXPIRY_SECONDS = 900
const REFRESH_ROTATION_GRACE_MS = 10_000
const REFRESH_RATE_LIMIT = { limit: 30, windowMs: 5 * 60 * 1000 }
const MAX_REFRESH_BODY_BYTES = 64 * 1024

const refreshRequestSchema = z.object({ refreshToken: z.string().trim().min(20).max(4096) })

export const Route = createFileRoute('/api/token/refresh/')({
  server: {
    handlers: {
      POST: async (opts) => {
        const request = opts.request
        try {
          const requestId = ''
          const clientIp = getClientIp(request.headers)
          const userAgent = request.headers.get('user-agent') || ''

          const originRejection = rejectDisallowedMobileOrigin(request)
          if (originRejection) return originRejection

          const declaredLength = Number(request.headers.get('content-length') ?? '0')
          if (Number.isFinite(declaredLength) && declaredLength > MAX_REFRESH_BODY_BYTES) {
            return new Response(JSON.stringify({ error: 'Request body too large' }), {
              status: 413,
              headers: { 'Content-Type': 'application/json', ...buildMobileCorsHeaders(request) },
            })
          }

          // Charge the per-IP budget before parsing the body so an over-limit
          // caller cannot force a full JSON parse or a token-key write.
          const ipDecision = await consumeRateLimit({ namespace: 'token-refresh:ip', identifierParts: [clientIp], limit: REFRESH_RATE_LIMIT.limit, windowMs: REFRESH_RATE_LIMIT.windowMs })
          if (!ipDecision.allowed && ipDecision.backend !== 'unavailable') {
            await recordSecurityEvent({ eventType: 'rate_limit_exceeded', route: '/api/token/refresh', requestId, ip: clientIp, userAgent, outcome: 'denied', reasonCode: 'rate_limit' })
            return new Response(JSON.stringify({ error: 'Too many refresh attempts', details: 'rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json', ...buildMobileCorsHeaders(request), ...getRateLimitHeaders(ipDecision), 'Retry-After': String(ipDecision.retryAfterSeconds) } })
          }

          const body = await request.json().catch(() => null)
          const parsed = refreshRequestSchema.safeParse(body)
          const tokenFingerprint = parsed.success ? hashToken(parsed.data.refreshToken) : 'invalid-body'

          const tokenDecision = await consumeRateLimit({ namespace: 'token-refresh:token', identifierParts: [tokenFingerprint], limit: REFRESH_RATE_LIMIT.limit, windowMs: REFRESH_RATE_LIMIT.windowMs })
          const rateLimitDecision = !tokenDecision.allowed ? tokenDecision : ipDecision
          const baseHeaders = { ...buildMobileCorsHeaders(request), ...getRateLimitHeaders(rateLimitDecision), 'Cache-Control': 'no-store' }

          if (!tokenDecision.allowed && tokenDecision.backend !== 'unavailable') {
            await recordSecurityEvent({ eventType: 'rate_limit_exceeded', route: '/api/token/refresh', requestId, ip: clientIp, userAgent, outcome: 'denied', reasonCode: 'rate_limit' })
            return new Response(JSON.stringify({ error: 'Too many refresh attempts', details: 'rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json', ...baseHeaders, 'Retry-After': String(tokenDecision.retryAfterSeconds) } })
          }
          if (!parsed.success) {
            return new Response(JSON.stringify({ error: 'Invalid request payload', details: parsed.error.issues[0]?.message ?? 'invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json', ...baseHeaders } })
          }

          const payload = await verifyRefreshToken(parsed.data.refreshToken)
          if (!payload?.installId) {
            await recordSecurityEvent({ eventType: 'auth_failed', route: '/api/token/refresh', requestId, ip: clientIp, userAgent, outcome: 'denied', reasonCode: 'invalid_refresh_token' })
            return new Response(JSON.stringify({ error: 'Invalid or expired refresh token', details: 'refresh token verification failed' }), { status: 401, headers: { 'Content-Type': 'application/json', ...baseHeaders } })
          }

          const incomingHash = hashToken(parsed.data.refreshToken)

          const [issuedRefreshToken, accessToken] = await Promise.all([issueRefreshToken(payload.installId), generateAccessToken(payload.installId)])

          const updated = await prisma.$transaction(async (tx) => {
            const install = await tx.install.findUnique({ where: { installId: payload.installId } })
            if (!install || !install.isActive || install.revokedAt) {
              return { error: 'install_inactive' as const }
            }

            if (install.refreshTokenHash !== incomingHash) {
              if (
                install.previousRefreshTokenHash === incomingHash &&
                install.previousRefreshTokenExpiresAt &&
                install.previousRefreshTokenExpiresAt.getTime() > Date.now() &&
                install.previousRefreshTokenCiphertext &&
                install.previousAccessTokenCiphertext
              ) {
                return {
                  error: 'refresh_replay' as const,
                  accessToken: decryptTokenValue(install.previousAccessTokenCiphertext),
                  refreshToken: decryptTokenValue(install.previousRefreshTokenCiphertext),
                }
              }

              await tx.install.update({ where: { installId: install.installId }, data: { isActive: false, revokedAt: new Date() } })
              return { error: 'token_reuse' as const }
            }

            await tx.install.update({
              where: { installId: install.installId },
              data: {
                previousRefreshTokenHash: install.refreshTokenHash,
                previousRefreshTokenExpiresAt: new Date(Date.now() + REFRESH_ROTATION_GRACE_MS),
                previousRefreshTokenCiphertext: encryptTokenValue(issuedRefreshToken.token),
                previousAccessTokenCiphertext: encryptTokenValue(accessToken),
                refreshTokenHash: hashToken(issuedRefreshToken.token),
                refreshTokenIssuedAt: issuedRefreshToken.issuedAt,
                lastSeenAt: issuedRefreshToken.issuedAt,
                lastAuthAt: issuedRefreshToken.issuedAt,
                revokedAt: null,
                isActive: true,
              },
            })

            return { error: null as null, installId: install.installId }
          })

          if (updated.error === 'install_inactive') {
            await recordSecurityEvent({ eventType: 'auth_failed', route: '/api/token/refresh', requestId, installId: payload.installId, ip: clientIp, userAgent, outcome: 'denied', reasonCode: 'install_inactive' })
            return new Response(JSON.stringify({ error: 'Installation not found or inactive', details: 'install_inactive' }), { status: 401, headers: { 'Content-Type': 'application/json', ...baseHeaders } })
          }

          if (updated.error === 'token_reuse') {
            await recordSecurityEvent({ eventType: 'token_reuse_detected', route: '/api/token/refresh', requestId, installId: payload.installId, ip: clientIp, userAgent, outcome: 'denied', reasonCode: 'refresh_token_reuse' })
            return new Response(JSON.stringify({ error: 'Refresh token revoked', details: 'refresh_token_reuse' }), { status: 401, headers: { 'Content-Type': 'application/json', ...baseHeaders } })
          }
          if (updated.error === 'refresh_replay') {
            return new Response(JSON.stringify({ accessToken: updated.accessToken, refreshToken: updated.refreshToken, expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS }), { status: 200, headers: { 'Content-Type': 'application/json', ...baseHeaders } })
          }
          await recordSecurityEvent({ eventType: 'token_refreshed', route: '/api/token/refresh', requestId, installId: updated.installId, ip: clientIp, userAgent, outcome: 'success' })

          return new Response(JSON.stringify({ accessToken, refreshToken: issuedRefreshToken.token, expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS }), { status: 200, headers: { 'Content-Type': 'application/json', ...baseHeaders } })
        } catch (error) {
          captureExceptionWithContext(error, { area: 'api.token-refresh', operation: 'POST /api/token/refresh' })
          logger.error('api.token_refresh.failed', { error })
          return applyMobileCors(
            request,
            new Response(JSON.stringify({ error: 'Failed to refresh token' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
          )
        }
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      OPTIONS: async (opts) => {
        return handleMobilePreflight(opts.request)
      },
    },
  },
})
