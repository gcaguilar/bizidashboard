import { NextRequest, NextResponse } from 'next/server';
import { withCache } from '@/lib/cache/cache';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'history:full';
const CACHE_TTL_SECONDS = 600;
const SOURCE_URL = 'https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json';

type CoverageRow = {
  firstRecordedAt: string | null;
  lastRecordedAt: string | null;
  totalSamples: number;
};

type StationsRow = {
  totalStations: number;
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

export async function GET(request?: NextRequest): Promise<NextResponse> {
  try {
    const format = request ? new URL(request.url).searchParams.get('format') : null;
    const payload = await withCache(CACHE_KEY, CACHE_TTL_SECONDS, async () => {
      const [coverageRows, stationRows, dailyHistoryRows] = await Promise.all([
        prisma.$queryRaw<CoverageRow[]>`
          SELECT
            MIN(recordedAt) AS firstRecordedAt,
            MAX(recordedAt) AS lastRecordedAt,
            COUNT(*) AS totalSamples
          FROM StationStatus;
        `,
        prisma.$queryRaw<StationsRow[]>`
          SELECT COUNT(*) AS totalStations
          FROM Station
          WHERE isActive = true;
        `,
        prisma.$queryRaw<DailyHistoryRow[]>`
          SELECT
            date(bucketStart) AS day,
            SUM((bikesMax - bikesMin) + (anchorsMax - anchorsMin)) AS demandScore,
            AVG(occupancyAvg) AS avgOccupancy,
            AVG(MAX(0, 1 - (2 * ABS(occupancyAvg - 0.5)))) AS balanceIndex,
            SUM(sampleCount) AS sampleCount
          FROM HourlyStationStat
          GROUP BY date(bucketStart)
          ORDER BY day ASC;
        `,
      ]);

      const coverage = coverageRows[0] ?? {
        firstRecordedAt: null,
        lastRecordedAt: null,
        totalSamples: 0,
      };

      const totalStations = Number(stationRows[0]?.totalStations ?? 0);

      return {
        source: {
          provider: 'Bizi Zaragoza GBFS',
          gbfsDiscoveryUrl: SOURCE_URL,
        },
        coverage: {
          firstRecordedAt: coverage.firstRecordedAt,
          lastRecordedAt: coverage.lastRecordedAt,
          totalSamples: Number(coverage.totalSamples ?? 0),
          totalStations,
          totalDays: dailyHistoryRows.length,
        },
        history: dailyHistoryRows.map((row) => ({
          day: row.day,
          demandScore: Number(row.demandScore ?? 0),
          avgOccupancy: Number(row.avgOccupancy ?? 0),
          balanceIndex: Number(row.balanceIndex ?? 0),
          sampleCount: Number(row.sampleCount ?? 0),
        })),
        generatedAt: new Date().toISOString(),
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
