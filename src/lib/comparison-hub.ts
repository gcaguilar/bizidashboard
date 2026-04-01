import 'server-only';

import { prisma } from '@/lib/db';
import { combineDataStates, type DataState } from '@/lib/data-state';
import { fetchDistrictCollection } from '@/lib/districts';
import { getDailyMobilityConclusions } from '@/lib/mobility-conclusions';
import { isValidMonthKey } from '@/lib/months';
import { buildDistrictSeoRows } from '@/lib/seo-districts';
import {
  getDailyDemandCurve,
  getMonthlyDemandCurve,
  getSystemHourlyProfile,
} from '@/analytics/queries/read';
import {
  fetchAvailableDataMonths,
  fetchRankings,
  fetchSharedDatasetSnapshot,
  fetchStations,
} from '@/lib/api';
import {
  buildFallbackDatasetSnapshot,
  buildFallbackStations,
} from '@/lib/shared-data-fallbacks';
import {
  buildComparisonHubViewModel,
  buildFallbackComparisonSections,
} from '@/lib/comparison-hub-builders';

type HistoryCompareRow = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  balanceIndex: number;
  sampleCount: number;
};

export type ComparisonCard = {
  id:
    | 'station-vs-station'
    | 'district-vs-district'
    | 'month-vs-month'
    | 'year-vs-year'
    | 'weekday-vs-weekend'
    | 'hour-vs-hour'
    | 'periods'
    | 'before-after-expansion'
    | 'events-vs-normal'
    | 'ranking-changes'
    | 'demand-changes'
    | 'balance-changes';
  title: string;
  eyebrow: string;
  summary: string;
  metricA: string;
  metricB: string;
  delta: string;
  href: string;
  note?: string;
};

export type ComparisonSection = {
  id: 'current' | 'historical' | 'changes';
  title: string;
  description: string;
  cards: ComparisonCard[];
};

export type InteractiveComparisonDimensionId =
  | 'stations'
  | 'districts'
  | 'months'
  | 'years'
  | 'hours'
  | 'periods';

export type InteractiveComparisonOption = {
  id: string;
  label: string;
  href: string;
  primaryLabel: string;
  primaryValue: number | null;
  primaryDisplay: string;
  secondaryLabel: string;
  secondaryDisplay: string;
  tertiaryLabel?: string;
  tertiaryDisplay?: string;
  note?: string;
};

export type InteractiveComparisonDimension = {
  id: InteractiveComparisonDimensionId;
  label: string;
  description: string;
  options: InteractiveComparisonOption[];
  defaultLeftId: string | null;
  defaultRightId: string | null;
};

export type InteractiveComparisonData = {
  defaultDimensionId: InteractiveComparisonDimensionId | null;
  dimensions: InteractiveComparisonDimension[];
};

export type ComparisonHubData = {
  latestMonth: string | null;
  generatedAt: string;
  dataState: DataState;
  interactive: InteractiveComparisonData;
  sections: ComparisonSection[];
};

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
    },
    sections: buildFallbackComparisonSections(),
  };
}

async function getRecentHistoryRows(): Promise<HistoryCompareRow[]> {
  return prisma.$queryRaw<HistoryCompareRow[]>`
    SELECT
      TO_CHAR("bucketStart", 'YYYY-MM-DD') AS day,
      SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) AS "demandScore",
      AVG("occupancyAvg") AS "avgOccupancy",
      AVG(CASE
        WHEN ABS("occupancyAvg" - 0.5) >= 0.5 THEN 0
        ELSE 1 - (2 * ABS("occupancyAvg" - 0.5))
      END) AS "balanceIndex",
      SUM("sampleCount") AS "sampleCount"
    FROM "HourlyStationStat"
    WHERE "bucketStart" >= NOW() - INTERVAL '90 days'
      AND "occupancyAvg" IS NOT NULL
    GROUP BY TO_CHAR("bucketStart", 'YYYY-MM-DD')
    ORDER BY day ASC;
  `;
}

export async function getComparisonHubData(): Promise<ComparisonHubData> {
  const nowIso = new Date().toISOString();
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
  ] = await Promise.all([
    fetchStations().catch(() => buildFallbackStations(nowIso)),
    fetchRankings('turnover', 10).catch(() => ({
      type: 'turnover' as const,
      limit: 10,
      rankings: [],
      districtSpotlight: [],
      generatedAt: nowIso,
      dataState: 'no_coverage' as const,
    })),
    fetchRankings('availability', 10).catch(() => ({
      type: 'availability' as const,
      limit: 10,
      rankings: [],
      districtSpotlight: [],
      generatedAt: nowIso,
      dataState: 'no_coverage' as const,
    })),
    fetchDistrictCollection().catch(() => null),
    fetchAvailableDataMonths().catch(() => ({ months: [], generatedAt: nowIso })),
    getMonthlyDemandCurve(24).catch(() => []),
    getDailyDemandCurve(90).catch(() => []),
    getSystemHourlyProfile(30).catch(() => []),
    getRecentHistoryRows().catch(() => []),
    fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
  ]);

  const districtRows = buildDistrictSeoRows({
    stations: stationsResponse.stations,
    districtCollection,
    turnoverRankings: turnoverResponse.rankings,
    availabilityRankings: availabilityResponse.rankings,
  });

  const validMonths = monthsResponse.months.filter(isValidMonthKey);
  const latestMonth =
    validMonths[0] ?? monthlySeries[monthlySeries.length - 1]?.monthKey ?? null;
  const previousMonth =
    validMonths[1] ?? monthlySeries[monthlySeries.length - 2]?.monthKey ?? null;
  const [recentConclusions, latestMonthConclusions, previousMonthConclusions] =
    await Promise.all([
      getDailyMobilityConclusions().catch(() => null),
      latestMonth
        ? getDailyMobilityConclusions(latestMonth).catch(() => null)
        : Promise.resolve(null),
      previousMonth
        ? getDailyMobilityConclusions(previousMonth).catch(() => null)
        : Promise.resolve(null),
    ]);

  const { interactive, sections } = buildComparisonHubViewModel({
    stations: stationsResponse.stations,
    turnoverRankings: turnoverResponse.rankings.map((row) => ({
      stationId: row.stationId,
      turnoverScore: Number(row.turnoverScore),
    })),
    availabilityRankings: availabilityResponse.rankings.map((row) => ({
      stationId: row.stationId,
      emptyHours: Number(row.emptyHours),
      fullHours: Number(row.fullHours),
    })),
    districtRows,
    monthlySeries: monthlySeries.map((row) => ({
      monthKey: row.monthKey,
      demandScore: Number(row.demandScore),
      avgOccupancy: Number(row.avgOccupancy),
      activeStations: Number(row.activeStations),
      sampleCount: Number(row.sampleCount),
    })),
    recentDemand: recentDemand.map((row) => ({
      day: row.day,
      demandScore: Number(row.demandScore),
      avgOccupancy: Number(row.avgOccupancy),
      sampleCount: Number(row.sampleCount),
    })),
    hourlyProfile: hourlyProfile.map((row) => ({
      hour: Number(row.hour),
      avgOccupancy: Number(row.avgOccupancy),
      avgBikesAvailable: Number(row.avgBikesAvailable),
      sampleCount: Number(row.sampleCount),
    })),
    historyRows: historyRows.map((row) => ({
      day: row.day,
      demandScore: Number(row.demandScore),
      avgOccupancy: Number(row.avgOccupancy),
      balanceIndex: Number(row.balanceIndex),
      sampleCount: Number(row.sampleCount),
    })),
    datasetCoverageDays: dataset.coverage.totalDays,
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

/**
 * Muchas lecturas en paralelo (API cacheada, Prisma, conclusiones diarias).
 * Un tope de pocos segundos devolvía siempre el fallback vacío en producción (p. ej. cold start / DB remota).
 */
export async function getComparisonHubDataWithTimeout(
  timeoutMs = 28_000
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
