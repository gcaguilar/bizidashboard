import { NextRequest, NextResponse } from 'next/server';
import {
  getDailyDemandCurve,
  getHourlyMobilitySignals,
  getSystemHourlyProfile,
  getHourlyTransitImpact,
} from '@/analytics/queries/read';
import { withCache } from '@/lib/cache/cache';
import { isValidMonthKey } from '@/lib/months';

export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 300;
const DEFAULT_MOBILITY_DAYS = 14;
const DEFAULT_DEMAND_DAYS = 30;
const TRANSIT_MIN_RECOMMENDED_SAMPLES = 6;

type ErrorWithMeta = {
  cause?: unknown;
  meta?: {
    driverAdapterError?: unknown;
  };
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isMissingTableError(error: unknown): boolean {
  const message = toErrorMessage(error).toLowerCase();

  if (message.includes('no such table') || message.includes('p2021')) {
    return true;
  }

  if (error && typeof error === 'object') {
    const maybeError = error as ErrorWithMeta;

    if (maybeError.cause && isMissingTableError(maybeError.cause)) {
      return true;
    }

    if (
      maybeError.meta?.driverAdapterError &&
      isMissingTableError(maybeError.meta.driverAdapterError)
    ) {
      return true;
    }
  }

  return false;
}

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
      },
      { status: 400 }
    );
  }

  try {
    const cacheKey = `mobility:mobilityDays=${mobilityDays}:demandDays=${demandDays}:month=${monthKey ?? 'all'}`;
    const payload = await withCache(cacheKey, CACHE_TTL_SECONDS, async () => {
      const [hourlySignals, dailyDemand, systemHourlyProfile] = await Promise.all([
        getHourlyMobilitySignals(mobilityDays, monthKey ?? undefined),
        getDailyDemandCurve(demandDays, monthKey ?? undefined),
        getSystemHourlyProfile(mobilityDays, monthKey ?? undefined),
      ]);

      let transitWarning: string | null = null;
      let hourlyTransitImpact =
        [] as Awaited<ReturnType<typeof getHourlyTransitImpact>>;

      try {
        hourlyTransitImpact = await getHourlyTransitImpact(mobilityDays, monthKey ?? undefined);
      } catch (error) {
        if (isMissingTableError(error)) {
          console.warn(
            '[API Mobility] Transit impact skipped because transit tables are missing. Run migrations to enable this section.'
          );
          transitWarning =
            'Transit impact unavailable because transit tables are missing.';
        } else {
          throw error;
        }
      }

      const normalizedTransitImpact = hourlyTransitImpact.map((row) => ({
        provider: String(row.provider).toLowerCase(),
        hour: Number(row.hour),
        avgDeparturesWithTransit: Number(row.avgDeparturesWithTransit),
        avgDeparturesWithoutTransit: Number(row.avgDeparturesWithoutTransit),
        uplift: Number(row.uplift),
        upliftRatio:
          row.upliftRatio === null || row.upliftRatio === undefined
            ? null
            : Number(row.upliftRatio),
        avgArrivalPressure: Number(row.avgArrivalPressure),
        totalArrivalEvents: Number(row.totalArrivalEvents),
        samplesWithTransit: Number(row.samplesWithTransit),
        samplesWithoutTransit: Number(row.samplesWithoutTransit),
      }));

      const maxComparableTransitSamples = normalizedTransitImpact.reduce(
        (maxSamples, row) =>
          Math.max(
            maxSamples,
            Math.min(row.samplesWithTransit, row.samplesWithoutTransit)
          ),
        0
      );

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
          bikesInCirculation: Number(row.bikesInCirculation),
          sampleCount: Number(row.sampleCount),
        })),
        transitImpact: {
          lookbackDays: mobilityDays,
          methodology:
            'Compara salidas medias por estacion/hora cuando hay llegadas de transporte publico cercano (tram o bus) frente a cuando no hay llegadas inminentes.',
          minimumRecommendedSamples: TRANSIT_MIN_RECOMMENDED_SAMPLES,
          hasLowCoverage:
            normalizedTransitImpact.length === 0 ||
            maxComparableTransitSamples < TRANSIT_MIN_RECOMMENDED_SAMPLES,
          warning: transitWarning,
          hourly: normalizedTransitImpact,
        },
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
