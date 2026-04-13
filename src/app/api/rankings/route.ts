import { NextRequest, NextResponse } from 'next/server';
import {
  getStationPatternsBulk,
  getStationRankings,
  getStationsWithLatestStatus,
  type RankingType,
} from '@/analytics/queries/read';
import { withCache } from '@/lib/cache/cache';
import { rowsToCsv } from '@/lib/csv';
import { resolveRankingsDataState } from '@/lib/data-state';
import { buildStationDistrictMap, fetchDistrictCollection } from '@/lib/districts';
import { logger } from '@/lib/logger';
import {
  attachPeakFullHours,
  buildDistrictSpotlight,
  buildPeakFullHoursByStation,
  enrichRankingRows,
} from '@/lib/ranking-enrichment';
import { captureExceptionWithContext, captureWarningWithContext } from '@/lib/sentry-reporting';
import { withApiRequest } from '@/lib/security/http';
import { enforcePublicApiAccess } from '@/lib/security/public-api';
import { getSharedDatasetSnapshot } from '@/services/shared-data';

export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 300;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 500;
const PUBLIC_ROUTE_RATE_LIMIT = {
  limit: 30,
  windowMs: 60_000,
};

function parseLimit(value: string | null, fallback: number): number | null {
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > MAX_LIMIT) return null;
  return parsed;
}

const RANKING_CSV_HEADERS = [
  'stationId',
  'stationName',
  'districtName',
  'turnoverScore',
  'emptyHours',
  'fullHours',
  'problemHours',
  'emptyHourShare',
  'demandVsStressedHint',
  'peakFullHoursJson',
  'totalHours',
  'windowStart',
  'windowEnd',
];

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withApiRequest(
    request,
    {
      route: '/api/rankings',
      routeGroup: 'public.api',
    },
    async ({ requestId, clientIp, userAgent }) => {
      const { searchParams } = new URL(request.url);
      const typeParam = searchParams.get('type');
      const limit = parseLimit(searchParams.get('limit'), DEFAULT_LIMIT);
      const format = searchParams.get('format');

      if (typeParam !== 'turnover' && typeParam !== 'availability') {
        return NextResponse.json(
          { error: 'Invalid type. Use turnover or availability.', dataState: 'error' },
          { status: 400 }
        );
      }

      if (limit === null) {
        return NextResponse.json(
          { error: 'Invalid limit. Provide a positive integer.', dataState: 'error' },
          { status: 400 }
        );
      }

      const access = await enforcePublicApiAccess({
        route: '/api/rankings',
        request,
        requestId,
        clientIp,
        userAgent,
        namespace: 'public-rankings',
        limit: PUBLIC_ROUTE_RATE_LIMIT.limit,
        windowMs: PUBLIC_ROUTE_RATE_LIMIT.windowMs,
        requireApiKey: format === 'csv' || limit > 100,
      });

      if (!access.ok) {
        return access.response;
      }

      try {
        const cacheKey = `rankings:type=${typeParam}:limit=${limit}`;
        const payload = await withCache(cacheKey, CACHE_TTL_SECONDS, async () => {
          const [rankings, stations, districtCollection, dataset] = await Promise.all([
            getStationRankings(typeParam as RankingType, limit),
            getStationsWithLatestStatus(),
            fetchDistrictCollection().catch(() => null),
            getSharedDatasetSnapshot().catch(() => null),
          ]);

          const stationNameById = new Map(stations.map((s) => [s.id, s.name]));
          const districtNameById =
            districtCollection !== null
              ? buildStationDistrictMap(
                  stations.map((s) => ({ id: s.id, lon: s.lon, lat: s.lat })),
                  districtCollection
                )
              : new Map<string, string>();

          let enrichedRankings = enrichRankingRows(rankings, stationNameById, districtNameById);
          const patternRows = await getStationPatternsBulk(
            enrichedRankings.map((r) => r.stationId)
          ).catch((error) => {
            captureWarningWithContext('Rankings API degraded: station pattern enrichment fallback applied.', {
              area: 'api.rankings',
              operation: 'GET /api/rankings',
              dedupeKey: 'api.rankings.station-patterns-fallback',
              extra: { type: typeParam, limit, reason: String(error) },
            });
            return [];
          });
          const peakMap = buildPeakFullHoursByStation(patternRows);
          enrichedRankings = attachPeakFullHours(enrichedRankings, peakMap);

          const districtSpotlight = buildDistrictSpotlight(
            enrichedRankings,
            typeParam as RankingType
          );

          return {
            type: typeParam,
            limit,
            rankings: enrichedRankings,
            districtSpotlight,
            generatedAt: new Date().toISOString(),
            dataState: resolveRankingsDataState({
              count: enrichedRankings.length,
              coverage: dataset?.coverage,
              status: dataset?.pipeline,
              requestedLimit: limit,
            }),
          };
        });

        if (format === 'csv') {
          const csvData = payload.rankings.map((row) => ({
            stationId: row.stationId,
            stationName: row.stationName,
            districtName: row.districtName ?? '',
            turnoverScore: row.turnoverScore,
            emptyHours: row.emptyHours,
            fullHours: row.fullHours,
            problemHours: row.problemHours,
            emptyHourShare: row.emptyHourShare,
            demandVsStressedHint: row.demandVsStressedHint,
            peakFullHoursJson: JSON.stringify(row.peakFullHours),
            totalHours: row.totalHours,
            windowStart: row.windowStart,
            windowEnd: row.windowEnd,
          }));
          const csv = rowsToCsv(RANKING_CSV_HEADERS, csvData);
          return new NextResponse(csv, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="rankings-${typeParam}.csv"`,
              'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
              ...access.headers,
            },
          });
        }

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
          area: 'api.rankings',
          operation: 'GET /api/rankings',
          extra: {
            type: typeParam,
            limit,
            format,
          },
        });
        logger.error('api.rankings.failed', { error });
        return NextResponse.json(
          {
            error: 'Failed to fetch rankings',
            timestamp: new Date().toISOString(),
            dataState: 'error',
          },
          { status: 500, headers: access.headers }
        );
      }
    }
  );
}
