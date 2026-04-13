import { NextRequest, NextResponse } from 'next/server';
import { getActiveAlerts } from '@/analytics/queries/read';
import { withCache } from '@/lib/cache/cache';
import { errorResponse } from '@/lib/api-response';
import { resolveAlertsDataState } from '@/lib/data-state';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { withApiRequest } from '@/lib/security/http';
import { enforcePublicApiAccess } from '@/lib/security/public-api';

export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 300;
const DEFAULT_LIMIT = 50;
const PUBLIC_ROUTE_RATE_LIMIT = {
  limit: 30,
  windowMs: 60_000,
};

const MAX_LIMIT = 500;

function parseLimit(value: string | null, fallback: number): number | null {
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > MAX_LIMIT) return null;
  return parsed;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withApiRequest(
    request,
    {
      route: '/api/alerts',
      routeGroup: 'public.api',
    },
    async ({ requestId, clientIp, userAgent }) => {
      const { searchParams } = new URL(request.url);
      const limit = parseLimit(searchParams.get('limit'), DEFAULT_LIMIT);

      if (limit === null) {
        return NextResponse.json(
          { error: 'Invalid limit. Provide a positive integer.' },
          { status: 400 }
        );
      }

      const access = await enforcePublicApiAccess({
        route: '/api/alerts',
        request,
        requestId,
        clientIp,
        userAgent,
        namespace: 'public-alerts',
        limit: PUBLIC_ROUTE_RATE_LIMIT.limit,
        windowMs: PUBLIC_ROUTE_RATE_LIMIT.windowMs,
        requireApiKey: limit > 100,
      });

      if (!access.ok) {
        return access.response;
      }

      try {
        const cacheKey = `alerts:limit=${limit}`;
        const payload = await withCache(cacheKey, CACHE_TTL_SECONDS, async () => {
          const alerts = await getActiveAlerts(limit);
          return {
            limit,
            alerts,
            generatedAt: new Date().toISOString(),
          };
        });

        return NextResponse.json(payload, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
            ...access.headers,
          },
        });
      } catch (error) {
        captureExceptionWithContext(error, {
          area: 'api.alerts',
          operation: 'GET /api/alerts',
          extra: { limit },
        });
        logger.error('api.alerts.failed', { error });
        return errorResponse('Failed to fetch alerts', 500);
      }
    }
  );
}
