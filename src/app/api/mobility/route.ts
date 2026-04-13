import { NextRequest, NextResponse } from 'next/server';
import {
  fetchCachedDailyDemandCurve,
  fetchCachedHourlyMobilitySignals,
  fetchCachedSystemHourlyProfile,
} from '@/lib/analytics-series';
import { withCache } from '@/lib/cache/cache';
import { errorResponse } from '@/lib/api-response';
import { resolveMobilityDataState } from '@/lib/data-state';
import { logger } from '@/lib/logger';
import { isValidMonthKey } from '@/lib/months';
import { captureExceptionWithContext, captureWarningWithContext } from '@/lib/sentry-reporting';
import { withApiRequest } from '@/lib/security/http';
import { enforcePublicApiAccess } from '@/lib/security/public-api';
import { getSharedDatasetSnapshot } from '@/services/shared-data';

export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 300;
const DEFAULT_MOBILITY_DAYS = 14;
const DEFAULT_DEMAND_DAYS = 30;
const PUBLIC_ROUTE_RATE_LIMIT = {
  limit: 30,
  windowMs: 60_000,
};

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

export async function GET(request: NextRequest): Promise<Response> {
  return withApiRequest(
    request,
    {
      route: '/api/mobility',
      routeGroup: 'public.api',
    },
    async ({ requestId, clientIp, userAgent }) => {
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

      const access = await enforcePublicApiAccess({
        route: '/api/mobility',
        request,
        requestId,
        clientIp,
        userAgent,
        namespace: 'public-mobility',
        limit: PUBLIC_ROUTE_RATE_LIMIT.limit,
        windowMs: PUBLIC_ROUTE_RATE_LIMIT.windowMs,
        requireApiKey: mobilityDays > 30 || demandDays > 60,
      });

      if (!access.ok) {
        return access.response;
      }

      try {
        const cacheKey = `mobility:mobilityDays=${mobilityDays}:demandDays=${demandDays}:month=${monthKey ?? 'all'}`;
        const payload = await withCache(cacheKey, CACHE_TTL_SECONDS, async () => {
          const [hourlySignals, dailyDemand, systemHourlyProfile, dataset] = await Promise.all([
            fetchCachedHourlyMobilitySignals(mobilityDays, monthKey).catch((error) => {
              captureWarningWithContext('Mobility API degraded: hourly signals fallback applied.', {
                area: 'api.mobility',
                operation: 'GET /api/mobility',
                dedupeKey: 'api.mobility.hourly-signals-fallback',
                extra: { mobilityDays, monthKey, reason: String(error) },
              });
              return [];
            }),
            fetchCachedDailyDemandCurve(demandDays, monthKey).catch((error) => {
              captureWarningWithContext('Mobility API degraded: daily demand fallback applied.', {
                area: 'api.mobility',
                operation: 'GET /api/mobility',
                dedupeKey: 'api.mobility.daily-demand-fallback',
                extra: { demandDays, monthKey, reason: String(error) },
              });
              return [];
            }),
            fetchCachedSystemHourlyProfile(mobilityDays, monthKey).catch((error) => {
              captureWarningWithContext('Mobility API degraded: system hourly profile fallback applied.', {
                area: 'api.mobility',
                operation: 'GET /api/mobility',
                dedupeKey: 'api.mobility.system-hourly-fallback',
                extra: { mobilityDays, monthKey, reason: String(error) },
              });
              return [];
            }),
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
            ...access.headers,
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
        logger.error('api.mobility.failed', { error });

        return errorResponse('Failed to fetch mobility insights', 500);
      }
    }
  );
}
