import type {
  AvailableMonthsResponse,
  SharedDatasetSnapshot,
  StationsResponse,
  StatusResponse,
} from '@/lib/api-types';
import {
  resolveDataState,
  resolveDatasetDataState,
  resolveStatusDataState,
} from '@/lib/data-state';
import { formatMonthLabel, isValidMonthKey, previousMonthKey } from '@/lib/months';
import {
  EMPTY_SEASONALITY,
  EMPTY_WEEKDAY_WEEKEND,
  type MonthlyReport,
  type MonthlyReportComparison,
  type MonthlyReportHeadline,
} from '@/lib/monthly-report-types';
import { buildReportBalance } from '@/lib/report-balance';
import { buildPeriodCoverage } from '@/lib/temporal-comparison';
import type { HistoryMetadata, SharedDataSource } from '@/services/shared-data/types';

const FALLBACK_SHARED_DATA_SOURCE = {
  provider: 'Bizi Zaragoza GBFS',
  gbfsDiscoveryUrl: 'https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json',
};

export function buildFallbackStatus(nowIso: string): StatusResponse {
  const fallback = {
    pipeline: {
      lastSuccessfulPoll: null,
      totalRowsCollected: 0,
      pollsLast24Hours: 0,
        validationErrors: 0,
        consecutiveFailures: 0,
        lastDataFreshness: false,
        lastStationCount: 0,
        averageStationsPerPoll: 0,
        healthStatus: 'down' as const,
        healthReason: 'No se pudieron consultar las tablas de datos.',
      },
    quality: {
      freshness: {
        isFresh: false,
        lastUpdated: null,
        maxAgeSeconds: 600,
      },
      volume: {
        recentStationCount: 0,
        averageStationsPerPoll: 0,
        expectedRange: { min: 200, max: 500 },
      },
      lastCheck: null,
    },
    system: {
      uptime: nowIso,
      version: process.env.npm_package_version ?? '0.1.0',
      environment: process.env.NODE_ENV ?? 'production',
    },
    operations: {
      cache: {
        configured: false,
        available: false,
        backend: 'disabled' as const,
      },
      recentCollections: [],
      security: {
        failedAuthLast24Hours: 0,
        rateLimitedLast24Hours: 0,
        refreshTokenReuseLast24Hours: 0,
      },
    },
    timestamp: nowIso,
  };

  return {
    ...fallback,
    dataState: resolveStatusDataState(fallback),
  };
}

export function buildFallbackDatasetSnapshot(nowIso: string): SharedDatasetSnapshot {
  const fallback = {
    source: FALLBACK_SHARED_DATA_SOURCE,
    coverage: {
      firstRecordedAt: null,
      lastRecordedAt: null,
      totalSamples: 0,
      totalStations: 0,
      totalDays: 0,
      generatedAt: nowIso,
    },
    lastUpdated: {
      lastSampleAt: null,
      generatedAt: nowIso,
    },
    stats: {
      totalSamples: 0,
      totalStations: 0,
      totalDays: 0,
      generatedAt: nowIso,
    },
    pipeline: buildFallbackStatus(nowIso),
  };

  return {
    ...fallback,
    dataState: resolveDatasetDataState({
      coverage: fallback.coverage,
      status: fallback.pipeline,
    }),
  };
}

export function buildFallbackStations(nowIso: string): StationsResponse {
  return {
    stations: [],
    generatedAt: nowIso,
    dataState: resolveDataState({
      hasCoverage: false,
      hasData: false,
    }),
  };
}

export function buildFallbackAvailableMonths(nowIso: string): AvailableMonthsResponse {
  return {
    months: [],
    generatedAt: nowIso,
  };
}

export function buildFallbackHistoryMetadata(
  nowIso: string,
  source: SharedDataSource
): HistoryMetadata {
  return {
    source,
    coverage: {
      firstRecordedAt: null,
      lastRecordedAt: null,
      totalSamples: 0,
      totalStations: 0,
      totalDays: 0,
      generatedAt: nowIso,
    },
    generatedAt: nowIso,
  };
}

/**
 * Informe mensual vacio pero con la forma completa del payload. Los loaders de
 * informes lo usan cuando no hay datos o una fuente no esta disponible.
 */
export function buildFallbackMonthlyReport(monthKey: string, nowIso: string): MonthlyReport {
  const safeMonth = isValidMonthKey(monthKey) ? monthKey : nowIso.slice(0, 7);
  const coverage = buildPeriodCoverage(safeMonth, [], nowIso);
  const comparison: MonthlyReportComparison = {
    isComparable: false,
    periodLabel: 'comparación no disponible todavía',
    reason: 'No hay datos suficientes para comparar con el mes anterior.',
    normalizedDemandRatio: null,
    trend: 'sin-datos',
    previousMonthKey: previousMonthKey(safeMonth),
  };
  const headline: MonthlyReportHeadline = {
    demandScore: 0,
    avgOccupancy: 0,
    activeStations: 0,
    sampleCount: 0,
    demandDeltaRatio: null,
    occupancyDeltaRatio: null,
    peakHour: null,
    coveredDays: coverage.coveredDays,
    expectedDays: coverage.expectedDays,
  };

  return {
    monthKey: safeMonth,
    generatedAt: nowIso,
    hasReport: false,
    coverage,
    comparison,
    balance: buildReportBalance({ comparison, previousMonthKey: comparison.previousMonthKey }),
    headline,
    summary: `Todavía no hay datos suficientes para generar el informe de ${formatMonthLabel(safeMonth)}.`,
    highlights: [],
    recommendations: [],
    monthlyConclusions: [],
    peakDemandHours: [],
    weekdayWeekendProfile: EMPTY_WEEKDAY_WEEKEND,
    trends: { monthly: [], daily: [], hourly: [] },
    seasonality: EMPTY_SEASONALITY,
    districts: { mostActive: [], leastActive: [], undersupplied: [] },
    heatmap: [],
    problemSpots: { worstFriction: [], worstMorning: [], longestEpisodes: [] },
    redistribution: {
      networkFrictionRate: 0,
      emptyHours: 0,
      fullHours: 0,
      rotation: 0,
      ineffectiveStations: [],
      note: '',
    },
    topStations: [],
    leastUsedStations: [],
    anomalies: [],
  };
}
