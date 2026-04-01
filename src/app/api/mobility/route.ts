import { NextRequest, NextResponse } from 'next/server';
import {
  fetchCachedDailyDemandCurve,
  fetchCachedHourlyMobilitySignals,
  fetchCachedSystemHourlyProfile,
} from '@/lib/analytics-series';
import { withCache } from '@/lib/cache/cache';
import { resolveMobilityDataState } from '@/lib/data-state';
import { isValidMonthKey } from '@/lib/months';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { getSharedDatasetSnapshot } from '@/services/shared-data';

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
  const selectedMonth = searchParams.get('month');
  const monthKey = isValidMonthKey(selectedMonth) ? selectedMonth : null;

  if (mobilityDays === null || demandDays === null) {
    return NextResponse.json(
      {
        error:
          'Invalid days parameters. mobilityDays and demandDays must be 1..365.',
        dataState: 'error',
      },
      { status: 400 }
    );
  }

  try {
    const cacheKey = `mobility:mobilityDays=${mobilityDays}:demandDays=${demandDays}:month=${monthKey ?? 'all'}`;
    const payload = await withCache(cacheKey, CACHE_TTL_SECONDS, async () => {
      const [hourlySignals, dailyDemand, systemHourlyProfile, dataset] = await Promise.all([
        fetchCachedHourlyMobilitySignals(mobilityDays, monthKey),
        fetchCachedDailyDemandCurve(demandDays, monthKey),
        fetchCachedSystemHourlyProfile(mobilityDays, monthKey),
        getSharedDatasetSnapshot().catch(() => null),
      ]);

      return {
        mobilityDays,
        demandDays,
        selectedMonth: monthKey,
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
        systemHourlyProfile: systemHourlyProfile.map((row) => ({
          hour: Number(row.hour),
          avgOccupancy: Number(row.avgOccupancy),
          avgBikesAvailable: Number(row.avgBikesAvailable),
          sampleCount: Number(row.sampleCount),
        })),
        generatedAt: new Date().toISOString(),
        dataState: resolveMobilityDataState({
          dailyDemandCount: dailyDemand.length,
          hourlySignalCount: hourlySignals.length,
          requestedDemandDays: demandDays,
          coverage: dataset?.coverage,
          status: dataset?.pipeline,
        }),
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
    captureExceptionWithContext(error, {
      area: 'api.mobility',
      operation: 'GET /api/mobility',
      extra: {
        mobilityDays,
        demandDays,
        monthKey,
      },
    });
    console.error('[API Mobility] Error generating mobility insights:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch mobility insights',
        timestamp: new Date().toISOString(),
        dataState: 'error',
      },
      { status: 500 }
    );
  }
}
