import { NextResponse } from 'next/server'
import { openApiDocument } from '@/lib/openapi-document'
import { withApiRequest } from '@/lib/security/http'
import { enforcePublicApiAccess } from '@/lib/security/public-api'

export const dynamic = 'force-dynamic'
const PUBLIC_ROUTE_RATE_LIMIT = {
  limit: 20,
  windowMs: 60_000
}

export async function GET(request: Request): Promise<NextResponse> {
  return withApiRequest(
    request,
    {
      route: '/api/openapi.json',
      routeGroup: 'public.api',
    },
    async ({ requestId, clientIp, userAgent }) => {
      const access = await enforcePublicApiAccess({
        route: '/api/openapi.json',
        request,
        requestId,
        clientIp,
        userAgent,
        namespace: 'public-openapi',
        limit: PUBLIC_ROUTE_RATE_LIMIT.limit,
        windowMs: PUBLIC_ROUTE_RATE_LIMIT.windowMs,
        requireApiKey: false,
      })

      if (!access.ok) {
        return access.response
      }

      return NextResponse.json(openApiDocument, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...access.headers,
        }
      })
    }
  )
}
