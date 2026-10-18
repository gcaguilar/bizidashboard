import {
  getMonthlyCriticalEpisodes,
  getMonthlyNetworkHeatmap,
  getMonthlyStationMetrics,
  type MonthlyCriticalEpisodeRow,
  type MonthlyNetworkHeatmapRow,
  type MonthlyStationMetricRow,
} from '@/analytics/queries/monthly-report';
import { getStationsWithLatestStatus } from '@/analytics/queries/read';
import {
  fetchCachedDailyDemandCurve,
  fetchCachedMonthlyDemandCurve,
  fetchCachedSystemHourlyProfile,
  type DailyDemandSeriesRow,
  type MonthlyDemandSeriesRow,
  type SystemHourlyProfileSeriesRow,
} from '@/lib/analytics-series';
import type { DistrictCollection } from '@/lib/districts';
import { fetchDistrictCollection } from '@/lib/districts.server';
import {
  getDailyMobilityConclusions,
  type MobilityConclusionsPayload,
} from '@/lib/mobility-conclusions';
import { REPORT_MONTHS_WINDOW } from '@/lib/months';

export type { DailyDemandSeriesRow, MonthlyDemandSeriesRow, SystemHourlyProfileSeriesRow };
export type { MonthlyCriticalEpisodeRow, MonthlyNetworkHeatmapRow, MonthlyStationMetricRow };

export type StationWithLatestStatus = Awaited<ReturnType<typeof getStationsWithLatestStatus>>[number];

export type MonthlyReportConclusions = {
  payload: MobilityConclusionsPayload;
  fromCache: boolean;
};

/**
 * Puerto de datos del modulo del informe mensual. Cada operacion lee una fuente
 * y puede rechazar; la politica de degradacion (que fuente cae a vacio y cual
 * invalida el informe) vive en el modulo, no aqui.
 */
export type MonthlyReportSources = {
  loadMonthlySeries(): Promise<MonthlyDemandSeriesRow[]>;
  loadDailyCurve(days: number, monthKey?: string | null): Promise<DailyDemandSeriesRow[]>;
  loadHourlyProfile(days: number, monthKey?: string | null): Promise<SystemHourlyProfileSeriesRow[]>;
  loadConclusions(monthKey?: string | null): Promise<MonthlyReportConclusions>;
  loadStationMetrics(monthKey: string): Promise<MonthlyStationMetricRow[]>;
  loadEpisodes(monthKey: string): Promise<Record<string, MonthlyCriticalEpisodeRow>>;
  loadHeatmap(monthKey: string): Promise<MonthlyNetworkHeatmapRow[]>;
  loadStations(): Promise<StationWithLatestStatus[]>;
  loadDistricts(): Promise<DistrictCollection | null>;
};

/**
 * Adaptador vivo: solo llama a las fuentes impuras y deja propagar sus errores.
 * No degrada; de eso se encarga el modulo del informe.
 */
export function createLiveMonthlyReportSources(): MonthlyReportSources {
  return {
    loadMonthlySeries: () => fetchCachedMonthlyDemandCurve(REPORT_MONTHS_WINDOW),
    loadDailyCurve: (days, monthKey) => fetchCachedDailyDemandCurve(days, monthKey),
    loadHourlyProfile: (days, monthKey) => fetchCachedSystemHourlyProfile(days, monthKey),
    loadConclusions: (monthKey) => getDailyMobilityConclusions(monthKey),
    loadStationMetrics: (monthKey) => getMonthlyStationMetrics(monthKey),
    loadEpisodes: (monthKey) => getMonthlyCriticalEpisodes(monthKey),
    loadHeatmap: (monthKey) => getMonthlyNetworkHeatmap(monthKey),
    loadStations: () => getStationsWithLatestStatus(),
    loadDistricts: () => fetchDistrictCollection(),
  };
}
