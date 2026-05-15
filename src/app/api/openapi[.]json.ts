import { createFileRoute } from '@tanstack/react-router'
import { openApiDocument } from '@/lib/openapi-document'
import { enforcePublicApiAccess } from '@/lib/security/public-api'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { errorResponse } from '@/lib/api-response'

const PUBLIC_ROUTE_RATE_LIMIT = {
  limit: 20,
  windowMs: 60_000,
}

export const Route = createFileRoute('/api/openapi.json')({
  server: {
    handlers: {
      GET: async (opts) => {
        const request = opts.request
        try {
          const access = await enforcePublicApiAccess({
            route: '/api/openapi.json',
            request,
            requestId: '',
            clientIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
            userAgent: request.headers.get('user-agent') || '',
            namespace: 'public-openapi',
            limit: PUBLIC_ROUTE_RATE_LIMIT.limit,
            windowMs: PUBLIC_ROUTE_RATE_LIMIT.windowMs,
            requireApiKey: false,
          })

          if (!access.ok) {
            return access.response
          }

          return new Response(JSON.stringify(openApiDocument), {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
              ...access.headers,
            },
          })
        } catch (error) {
          captureExceptionWithContext(error, {
            area: 'api.openapi',
            operation: 'GET /api/openapi.json',
          })
          return errorResponse('Failed to serve OpenAPI document', 500)
        }
      },
    },
  },
})
