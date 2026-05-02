import { NextRequest, NextResponse } from 'next/server';
import { getStationPredictions } from '@/lib/predictions';
import { errorResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { withApiRequest } from '@/lib/security/http';
import { enforcePublicApiAccess } from '@/lib/security/public-api';

export const dynamic = 'force-dynamic';
const PUBLIC_ROUTE_RATE_LIMIT = {
  limit: 30,
  windowMs: 60_000,
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withApiRequest(
    request,
    {
      route: '/api/predictions',
      routeGroup: 'public.api',
    },
    async ({ requestId, clientIp, userAgent }) => {
      const stationId = new URL(request.url).searchParams.get('stationId')?.trim() ?? '';

      if (!stationId || stationId.length < 1 || stationId.length > 64) {
        return NextResponse.json(
          {
            error: 'stationId must be 1-64 characters',
          },
          { status: 400 }
        );
      }

      const access = await enforcePublicApiAccess({
        route: '/api/predictions',
        request,
        requestId,
        clientIp,
        userAgent,
        namespace: 'public-predictions',
        limit: PUBLIC_ROUTE_RATE_LIMIT.limit,
        windowMs: PUBLIC_ROUTE_RATE_LIMIT.windowMs,
        requireApiKey: false,
      });

      if (!access.ok) {
        return access.response;
      }

      try {
        const payload = await getStationPredictions(stationId);

        if (!payload) {
          return NextResponse.json(
            {
              error: 'station not found',
            },
            { status: 404, headers: access.headers }
          );
        }

        return NextResponse.json(payload, {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
            ...access.headers,
          },
        });
      } catch (error) {
        captureExceptionWithContext(error, {
          area: 'api.predictions',
          operation: 'GET /api/predictions',
          extra: { stationId },
        });
        logger.error('api.predictions.failed', { error });

        return errorResponse('Failed to generate predictions', 500);
      }
    }
  );
}
