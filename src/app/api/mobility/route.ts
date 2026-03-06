import { NextRequest, NextResponse } from 'next/server';
import {
  getDailyDemandCurve,
  getHourlyMobilitySignals,
} from '@/analytics/queries/read';
import { withCache } from '@/lib/cache/cache';

export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 300;
const DEFAULT_MOBILITY_DAYS = 14;
const DEFAULT_DEMAND_DAYS = 30;

function parseDays(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number
): number | null {
  if (value === null) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    return null;
  }

  return parsed;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const mobilityDays = parseDays(
    searchParams.get('mobilityDays'),
    DEFAULT_MOBILITY_DAYS,
    1,
    365
  );
  const demandDays = parseDays(
    searchParams.get('demandDays'),
    DEFAULT_DEMAND_DAYS,
    1,
    365
  );

  if (mobilityDays === null || demandDays === null) {
    return NextResponse.json(
      {
        error:
          'Invalid days parameters. mobilityDays and demandDays must be 1..365.',
      },
      { status: 400 }
    );
  }

  try {
    const cacheKey = `mobility:mobilityDays=${mobilityDays}:demandDays=${demandDays}`;
    const payload = await withCache(cacheKey, CACHE_TTL_SECONDS, async () => {
      const [hourlySignals, dailyDemand] = await Promise.all([
        getHourlyMobilitySignals(mobilityDays),
        getDailyDemandCurve(demandDays),
      ]);

      return {
        mobilityDays,
        demandDays,
        methodology:
          'Matriz O-D estimada con variaciones netas horarias de bicis por estacion; no representa viajes individuales observados.',
        hourlySignals: hourlySignals.map((row) => ({
          stationId: row.stationId,
          hour: Number(row.hour),
          departures: Number(row.departures),
          arrivals: Number(row.arrivals),
          sampleCount: Number(row.sampleCount),
        })),
        dailyDemand: dailyDemand.map((row) => ({
          day: row.day,
          demandScore: Number(row.demandScore),
          avgOccupancy: Number(row.avgOccupancy),
          sampleCount: Number(row.sampleCount),
        })),
        generatedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[API Mobility] Error generating mobility insights:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch mobility insights',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
