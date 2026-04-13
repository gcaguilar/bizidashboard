import { NextRequest, NextResponse } from 'next/server';
import { getStationsWithLatestStatus } from '@/analytics/queries/read';
import { withCache } from '@/lib/cache/cache';
import { rowsToCsv } from '@/lib/csv';
import { resolveStationsDataState } from '@/lib/data-state';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { withApiRequest } from '@/lib/security/http';
import { enforcePublicApiAccess } from '@/lib/security/public-api';
import { getSharedDatasetSnapshot } from '@/services/shared-data';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'stations:current';
const CACHE_TTL_SECONDS = 60;
const PUBLIC_ROUTE_RATE_LIMIT = {
  limit: 40,
  windowMs: 60_000,
};

const STATIONS_CSV_HEADERS = ['stationId', 'stationName', 'lat', 'lon', 'capacity', 'bikesAvailable', 'anchorsFree', 'recordedAt'];

export async function GET(request?: NextRequest): Promise<NextResponse> {
  if (!request) {
    try {
      const payload = await withCache(CACHE_KEY, CACHE_TTL_SECONDS, async () => {
        const [stations, dataset] = await Promise.all([
          getStationsWithLatestStatus(),
          getSharedDatasetSnapshot().catch(() => null),
        ]);
        return {
          stations,
          generatedAt: new Date().toISOString(),
          dataState: resolveStationsDataState({
            count: stations.length,
            coverage: dataset?.coverage,
            status: dataset?.pipeline,
          }),
        };
      });

      return NextResponse.json(payload, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
        },
      });
    } catch (error) {
      captureExceptionWithContext(error, {
        area: 'api.stations',
        operation: 'GET /api/stations',
      });
      logger.error('api.stations.failed', { error });
      return NextResponse.json(
        {
          error: 'Failed to fetch stations',
          timestamp: new Date().toISOString(),
          dataState: 'error',
        },
        { status: 500 }
      );
    }
  }

  return withApiRequest(
    request,
    {
      route: '/api/stations',
      routeGroup: 'public.api',
    },
    async ({ requestId, clientIp, userAgent }) => {
      try {
        const format = new URL(request.url).searchParams.get('format');
        const access = await enforcePublicApiAccess({
          route: '/api/stations',
          request,
          requestId,
          clientIp,
          userAgent,
          namespace: 'public-stations',
          limit: PUBLIC_ROUTE_RATE_LIMIT.limit,
          windowMs: PUBLIC_ROUTE_RATE_LIMIT.windowMs,
          requireApiKey: format === 'csv',
        });

        if (!access.ok) {
          return access.response;
        }
        const payload = await withCache(CACHE_KEY, CACHE_TTL_SECONDS, async () => {
          const [stations, dataset] = await Promise.all([
            getStationsWithLatestStatus(),
            getSharedDatasetSnapshot().catch(() => null),
          ]);
          return {
            stations,
            generatedAt: new Date().toISOString(),
            dataState: resolveStationsDataState({
              count: stations.length,
              coverage: dataset?.coverage,
              status: dataset?.pipeline,
            }),
          };
        });

        if (format === 'csv') {
          const csv = rowsToCsv(STATIONS_CSV_HEADERS, payload.stations);
          return new NextResponse(csv, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': 'attachment; filename="stations-current.csv"',
              'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
              ...access.headers,
            },
          });
        }

        return NextResponse.json(payload, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
            ...access.headers,
          },
        });
      } catch (error) {
        const format = new URL(request.url).searchParams.get('format');
        captureExceptionWithContext(error, {
          area: 'api.stations',
          operation: 'GET /api/stations',
          extra: {
            format,
          },
        });
        logger.error('api.stations.failed', { error });

        return NextResponse.json(
          {
            error: 'Failed to fetch stations',
            timestamp: new Date().toISOString(),
            dataState: 'error',
          },
          { status: 500 }
        );
      }
    }
  );
}
