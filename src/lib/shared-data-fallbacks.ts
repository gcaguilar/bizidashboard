import type { AvailableMonthsResponse, StationsResponse } from '@/lib/api-types';
import { resolveDataState } from '@/lib/data-state';
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

/**
 * Fallbacks de los payloads de la API publica (estaciones, meses disponibles e
 * informe mensual). Las formas propias de shared-data (status, snapshot,
 * metadata) viven en `@/services/shared-data`.
 */

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
