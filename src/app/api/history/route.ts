import { NextRequest, NextResponse } from 'next/server';
import { withCache } from '@/lib/cache/cache';
import { prisma } from '@/lib/db';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { getHistoryMetadata } from '@/services/shared-data';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'history:full';
const CACHE_TTL_SECONDS = 600;

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

export async function GET(request?: NextRequest): Promise<NextResponse> {
  try {
    const format = request ? new URL(request.url).searchParams.get('format') : null;
    const payload = await withCache(CACHE_KEY, CACHE_TTL_SECONDS, async () => {
      const [historyMeta, dailyHistoryRows] = await Promise.all([
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
      ]);

      return {
        source: historyMeta.source,
        coverage: historyMeta.coverage,
        history: dailyHistoryRows.map((row) => ({
          day: row.day,
          demandScore: Number(row.demandScore ?? 0),
          avgOccupancy: Number(row.avgOccupancy ?? 0),
          balanceIndex: Number(row.balanceIndex ?? 0),
          sampleCount: Number(row.sampleCount ?? 0),
        })),
        generatedAt: historyMeta.generatedAt ?? new Date().toISOString(),
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
        },
      });
    }

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    captureExceptionWithContext(error, {
      area: 'api.history',
      operation: 'GET /api/history',
    });
    console.error('[API History] Error fetching historical data:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch historical data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
