import { withCache } from '@/lib/cache/cache';
import {
  fetchCachedDailyDemandCurve,
  fetchCachedMonthlyDemandCurve,
  fetchCachedStationDailyDemand,
  fetchCachedStationHourlyProfiles,
  fetchCachedSystemHourlyProfile,
} from '@/lib/analytics-series';
import { combineDataStates, type DataState } from '@/lib/data-state';
import { buildStationDistrictMap } from '@/lib/districts';
import { fetchDistrictCollection } from '@/lib/districts.server';
import { getHistorySeries } from '@/lib/history-read-model';
import { getDailyMobilityConclusions } from '@/lib/mobility-conclusions';
import { isValidMonthKey } from '@/lib/months';
import { buildDistrictSeoRows } from '@/lib/seo-districts';
import { getCityName } from '@/lib/site';
import {
  fetchAvailableDataMonths,
  fetchRankingsLite,
  fetchSharedDatasetSnapshot,
  fetchStations,
} from '@/lib/api';
import { buildFallbackStations } from '@/lib/shared-data-fallbacks';
import { buildFallbackDatasetSnapshot } from '@/services/shared-data';
import {
  buildComparisonHubViewModel,
  buildFallbackComparisonSections,
  type ComparisonSection,
  type InteractiveComparisonData,
} from '@/lib/comparison-hub-builders';

export type {
  ComparisonBand,
  ComparisonBandId,
  ComparisonCard,
  ComparisonMetric,
  ComparisonMetricKey,
  ComparisonPreset,
  ComparisonPresetId,
  ComparisonSection,
  ComparisonTrafficLight,
  InteractiveComparisonData,
  InteractiveComparisonDimension,
  InteractiveComparisonDimensionId,
  InteractiveComparisonOption,
  InteractiveComparisonScope,
  StationDailyDemandInput,
  StationDistrictInput,
  StationHourlyProfileInput,
} from '@/lib/comparison-hub-builders';

const COMPARISON_HUB_CACHE_TTL_SECONDS = 300;

export type ComparisonHubData = {
  latestMonth: string | null;
  generatedAt: string;
  dataState: DataState;
  interactive: InteractiveComparisonData;
  sections: ComparisonSection[];
};

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallbackValue: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallbackValue), timeoutMs);
    }),
  ]);
}

export function buildFallbackComparisonHubData(
  nowIso = new Date().toISOString()
): ComparisonHubData {
  return {
    latestMonth: null,
    generatedAt: nowIso,
    dataState: 'no_coverage',
    interactive: {
      defaultDimensionId: null,
      dimensions: [],
      presets: [],
    },
    sections: buildFallbackComparisonSections(),
  };
}

export async function getComparisonHubData(): Promise<ComparisonHubData> {
  return withCache(
    'comparison-hub:snapshot',
    COMPARISON_HUB_CACHE_TTL_SECONDS,
    async () => {
      const nowIso = new Date().toISOString();
      const sourceTimeoutMs = 8_000;
      const [
        stationsResponse,
        turnoverResponse,
        availabilityResponse,
        districtCollection,
        monthsResponse,
        monthlySeries,
        recentDemand,
        hourlyProfile,
        historyRows,
        dataset,
        stationHourlyProfiles,
        stationDailyDemand,
      ] = await Promise.all([
        withTimeout(
          fetchStations().catch(() => buildFallbackStations(nowIso)),
          sourceTimeoutMs,
          buildFallbackStations(nowIso)
        ),
        withTimeout(
          fetchRankingsLite('turnover', 10).catch(() => ({
            type: 'turnover' as const,
            limit: 10,
            rankings: [],
            generatedAt: nowIso,
            dataState: 'no_coverage' as const,
          })),
          sourceTimeoutMs,
          {
            type: 'turnover' as const,
            limit: 10,
            rankings: [],
            generatedAt: nowIso,
            dataState: 'no_coverage' as const,
          }
        ),
        withTimeout(
          fetchRankingsLite('availability', 10).catch(() => ({
            type: 'availability' as const,
            limit: 10,
            rankings: [],
            generatedAt: nowIso,
            dataState: 'no_coverage' as const,
          })),
          sourceTimeoutMs,
          {
            type: 'availability' as const,
            limit: 10,
            rankings: [],
            generatedAt: nowIso,
            dataState: 'no_coverage' as const,
          }
        ),
        withTimeout(fetchDistrictCollection().catch(() => null), sourceTimeoutMs, null),
        withTimeout(
          fetchAvailableDataMonths().catch(() => ({ months: [], generatedAt: nowIso })),
          sourceTimeoutMs,
          { months: [], generatedAt: nowIso }
        ),
        withTimeout(fetchCachedMonthlyDemandCurve(24).catch(() => []), sourceTimeoutMs, []),
        withTimeout(fetchCachedDailyDemandCurve(90).catch(() => []), sourceTimeoutMs, []),
        withTimeout(fetchCachedSystemHourlyProfile(30).catch(() => []), sourceTimeoutMs, []),
        withTimeout(getHistorySeries({ days: 90 }).catch(() => []), sourceTimeoutMs, []),
        withTimeout(
          fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
          sourceTimeoutMs,
          buildFallbackDatasetSnapshot(nowIso)
        ),
        withTimeout(fetchCachedStationHourlyProfiles(30).catch(() => []), sourceTimeoutMs, []),
        withTimeout(fetchCachedStationDailyDemand(90).catch(() => []), sourceTimeoutMs, []),
      ]);

      const districtRows = buildDistrictSeoRows({
        stations: stationsResponse.stations,
        districtCollection,
        turnoverRankings: turnoverResponse.rankings,
        availabilityRankings: availabilityResponse.rankings,
      });

      const stationDistrictNames = districtCollection
        ? buildStationDistrictMap(stationsResponse.stations, districtCollection)
        : new Map<string, string>();
      const districtSlugByName = new Map(districtRows.map((row) => [row.name, row.slug]));
      const stationDistricts = stationsResponse.stations.flatMap((station) => {
        const districtName = stationDistrictNames.get(station.id);
        if (!districtName) {
          return [];
        }
        const districtSlug = districtSlugByName.get(districtName);
        if (!districtSlug) {
          return [];
        }
        return [{ stationId: station.id, districtSlug, districtName }];
      });
      const cityName = getCityName();

      const validMonths = monthsResponse.months.filter(isValidMonthKey);
      const latestMonth =
        validMonths[0] ?? monthlySeries[monthlySeries.length - 1]?.monthKey ?? null;
      const previousMonth =
        validMonths[1] ?? monthlySeries[monthlySeries.length - 2]?.monthKey ?? null;
      const [recentConclusions, latestMonthConclusions, previousMonthConclusions] =
        await Promise.all([
          withTimeout(getDailyMobilityConclusions().catch(() => null), sourceTimeoutMs, null),
          latestMonth
            ? withTimeout(
                getDailyMobilityConclusions(latestMonth).catch(() => null),
                sourceTimeoutMs,
                null
              )
            : Promise.resolve(null),
          previousMonth
            ? withTimeout(
                getDailyMobilityConclusions(previousMonth).catch(() => null),
                sourceTimeoutMs,
                null
              )
            : Promise.resolve(null),
        ]);

      const { interactive, sections } = buildComparisonHubViewModel({
        stations: stationsResponse.stations,
        turnoverRankings: turnoverResponse.rankings,
        availabilityRankings: availabilityResponse.rankings,
        districtRows,
        monthlySeries,
        recentDemand,
        hourlyProfile,
        historyRows,
        datasetCoverageDays: dataset.coverage.totalDays,
        stationHourlyProfiles,
        stationDailyDemand,
        stationDistricts,
        cityName,
        comparisonNow: nowIso,
        latestMonth,
        previousMonth,
        recentPayload: recentConclusions?.payload ?? null,
        latestMonthPayload: latestMonthConclusions?.payload ?? null,
        previousMonthPayload: previousMonthConclusions?.payload ?? null,
      });

      return {
        latestMonth,
        generatedAt: nowIso,
        dataState: combineDataStates([
          dataset.dataState,
          stationsResponse.dataState,
          turnoverResponse.dataState,
          availabilityResponse.dataState,
        ]),
        interactive,
        sections,
      };
    }
  );
}

/**
 * Muchas lecturas en paralelo (API cacheada, Prisma, conclusiones diarias).
 * Un tope de pocos segundos devolvía siempre el fallback vacío en producción (p. ej. cold start / DB remota).
 */
export async function getComparisonHubDataWithTimeout(
  timeoutMs = 35_000
): Promise<ComparisonHubData> {
  const nowIso = new Date().toISOString();

  return Promise.race([
    getComparisonHubData(),
    new Promise<ComparisonHubData>((resolve) => {
      setTimeout(() => {
        resolve(buildFallbackComparisonHubData(nowIso));
      }, timeoutMs);
    }),
  ]);
}
