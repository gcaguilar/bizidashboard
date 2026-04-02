import { NextRequest, NextResponse } from 'next/server';
import { withCache } from '@/lib/cache/cache';
import { resolveHistoryDataState } from '@/lib/data-state';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { withApiRequest } from '@/lib/security/http';
import { enforcePublicApiAccess } from '@/lib/security/public-api';
import { getHistoryMetadata, getPipelineStatusSummary } from '@/services/shared-data';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'history:full';
const CACHE_TTL_SECONDS = 600;
const PUBLIC_ROUTE_RATE_LIMIT = {
  limit: 20,
  windowMs: 60_000,
};

type DailyHistoryRow = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  sampleCount: number;
  balanceIndex: number;
};

function toCsv(
  rows: Array<{
    day: string;
    demandScore: number;
    avgOccupancy: number;
    balanceIndex: number;
    sampleCount: number;
  }>
): string {
  const headers = ['day', 'demandScore', 'avgOccupancy', 'balanceIndex', 'sampleCount'];
  const values = rows.map((row) => [row.day, row.demandScore, row.avgOccupancy, row.balanceIndex, row.sampleCount]);
  return [headers, ...values]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

export async function GET(request?: NextRequest): Promise<Response> {
  if (!request) {
    return NextResponse.json(
      {
        error: 'Request context required',
        timestamp: new Date().toISOString(),
        dataState: 'error',
      },
      { status: 500 }
    );
  }

  return withApiRequest(
    request,
    {
      route: '/api/history',
      routeGroup: 'public.api',
    },
    async ({ requestId, clientIp, userAgent }) => {
      try {
        const format = new URL(request.url).searchParams.get('format');
        const access = await enforcePublicApiAccess({
          route: '/api/history',
          request,
          requestId,
          clientIp,
          userAgent,
          namespace: 'public-history',
          limit: PUBLIC_ROUTE_RATE_LIMIT.limit,
          windowMs: PUBLIC_ROUTE_RATE_LIMIT.windowMs,
          requireApiKey: format === 'csv',
        });

        if (!access.ok) {
          return access.response;
        }

        const payload = await withCache(CACHE_KEY, CACHE_TTL_SECONDS, async () => {
          const [historyMeta, dailyHistoryRows, status] = await Promise.all([
            getHistoryMetadata(),
            prisma.$queryRaw<DailyHistoryRow[]>`
              SELECT
                TO_CHAR("bucketStart", 'YYYY-MM-DD') AS day,
                SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) AS "demandScore",
                AVG("occupancyAvg") AS "avgOccupancy",
                AVG(CASE
                  WHEN "occupancyAvg" IS NULL THEN 0.5
                  WHEN ABS("occupancyAvg" - 0.5) >= 0.5 THEN 0
                  ELSE 1 - (2 * ABS("occupancyAvg" - 0.5))
                END) AS "balanceIndex",
                SUM("sampleCount") AS "sampleCount"
              FROM "HourlyStationStat"
              WHERE "occupancyAvg" IS NOT NULL
              GROUP BY TO_CHAR("bucketStart", 'YYYY-MM-DD')
              ORDER BY day ASC;
            `,
            getPipelineStatusSummary().catch(() => null),
          ]);

          const history = dailyHistoryRows.map((row) => ({
            day: row.day,
            demandScore: Number(row.demandScore ?? 0),
            avgOccupancy: Number(row.avgOccupancy ?? 0),
            balanceIndex: Number(row.balanceIndex ?? 0),
            sampleCount: Number(row.sampleCount ?? 0),
          }));

          return {
            source: historyMeta.source,
            coverage: historyMeta.coverage,
            history,
            generatedAt: historyMeta.generatedAt ?? new Date().toISOString(),
            dataState: resolveHistoryDataState({
              count: history.length,
              coverage: historyMeta.coverage,
              status,
              expectedDays: 30,
            }),
          };
        });

        if (format === 'csv') {
          const csv = toCsv(payload.history);
          return new NextResponse(csv, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': 'attachment; filename="history-balance.csv"',
              'Cache-Control': 'public, max-age=300, stale-while-revalidate=120',
              ...access.headers,
            },
          });
        }

        return NextResponse.json(payload, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=120',
            ...access.headers,
          },
        });
      } catch (error) {
        captureExceptionWithContext(error, {
          area: 'api.history',
          operation: 'GET /api/history',
        });
        logger.error('api.history.failed', { error });

        return NextResponse.json(
          {
            error: 'Failed to fetch historical data',
            timestamp: new Date().toISOString(),
            dataState: 'error',
          },
          { status: 500 }
        );
      }
    }
  );
}
