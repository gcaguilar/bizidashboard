import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { searchLocations } from '@/lib/geo/nominatim'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { recordSecurityEvent } from '@/lib/security/audit'
import { applyMobileCors, buildMobileCorsHeaders, handleMobilePreflight, rejectDisallowedMobileOrigin } from '@/lib/security/http'
import { verifyMobileRequest } from '@/lib/security/mobile-auth'
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit'

const GEO_SEARCH_RATE_LIMIT = { limit: 60, windowMs: 60_000 }

const geoSearchSchema = z.object({
  query: z.string().trim().min(2).max(200),
  limit: z.number().int().min(1).max(20).optional(),
  timestamp: z.number().int().positive().optional(),
  signature: z.string().trim().min(10).max(512).optional(),
})

export const Route = createFileRoute('/api/geo/search/')({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify({ error: 'Use POST /api/geo/search with a signed JSON body.' }), {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            Allow: 'POST, OPTIONS',
          },
        }),
      POST: async (opts) => {
        const request = opts.request
        try {
          const requestId = ''
          const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
          const userAgent = request.headers.get('user-agent') || ''

          const originRejection = rejectDisallowedMobileOrigin(request)
          if (originRejection) return originRejection

          const rawBody = await request.json().catch(() => null)
          const parsed = geoSearchSchema.safeParse(rawBody)
          const baseHeaders = buildMobileCorsHeaders(request)

          if (!parsed.success) {
            return new Response(JSON.stringify({ error: 'Invalid request payload', details: parsed.error.flatten() }), { status: 400, headers: { 'Content-Type': 'application/json', ...baseHeaders } })
          }

          const authResult = await verifyMobileRequest({ body: parsed.data, route: '/api/geo/search', request, requestId, clientIp, userAgent, headers: baseHeaders })
          if (!authResult.ok) return authResult.response

          const [ipDecision, installDecision] = await Promise.all([
            consumeRateLimit({ namespace: 'geo-search:ip', identifierParts: [clientIp], limit: GEO_SEARCH_RATE_LIMIT.limit, windowMs: GEO_SEARCH_RATE_LIMIT.windowMs }),
            consumeRateLimit({ namespace: 'geo-search:install', identifierParts: [authResult.installId], limit: GEO_SEARCH_RATE_LIMIT.limit, windowMs: GEO_SEARCH_RATE_LIMIT.windowMs }),
          ])
          const rateLimitDecision = !ipDecision.allowed ? ipDecision : installDecision
          const headers = { ...baseHeaders, ...getRateLimitHeaders(rateLimitDecision) }

          if (!rateLimitDecision.allowed) {
            await recordSecurityEvent({ eventType: 'rate_limit_exceeded', route: '/api/geo/search', requestId, installId: authResult.installId, ip: clientIp, userAgent, outcome: 'denied', reasonCode: 'rate_limit' })
            return new Response(JSON.stringify({ error: 'Too many geo search requests' }), { status: 429, headers: { 'Content-Type': 'application/json', ...headers, 'Retry-After': String(rateLimitDecision.retryAfterSeconds) } })
          }

          const results = await searchLocations(parsed.data.query, parsed.data.limit ?? 10)
          return new Response(JSON.stringify({ results }), { status: 200, headers: { 'Content-Type': 'application/json', ...headers, 'Cache-Control': 'public, max-age=3600, s-maxage=2592000' } })
        } catch (error) {
          captureExceptionWithContext(error, { area: 'api.geo-search', operation: 'POST /api/geo/search' })
          logger.error('api.geo_search.failed', { error })
          return applyMobileCors(
            request,
            new Response(JSON.stringify({ error: 'Failed to search locations' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
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
