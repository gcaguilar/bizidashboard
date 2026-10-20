import {
  fetchCachedDailyDemandCurve,
  fetchCachedMonthlyDemandCurve,
  fetchCachedSystemHourlyProfile,
  type DailyDemandSeriesRow,
  type MonthlyDemandSeriesRow,
  type SystemHourlyProfileSeriesRow,
} from '@/lib/analytics-series';
import { fetchAvailableDataMonths, fetchRankings, fetchStations } from '@/lib/api';
import type {
  AvailableMonthsResponse,
  RankingsResponse,
  StationsResponse,
} from '@/lib/api-types';
import {
  getDailyMobilityConclusions,
  type MobilityConclusionsPayload,
} from '@/lib/mobility-conclusions';
import { getDistrictSeoRows, type DistrictSeoRow } from '@/lib/seo-districts';
import { captureWarningWithContext } from '@/lib/sentry-reporting';
import { getRebalancingAvailabilitySummary } from '@/analytics/queries/rebalancing';
import type { RebalancingAvailabilitySummary } from '@/types/rebalancing';

/**
 * Puerto de fuentes de las landings SEO. Los constructores de contenido son
 * puros sobre este puerto; el adapter en vivo traduce cada lectura a la API
 * cacheada o a Prisma y aplica aqui la degradacion (una forma vacia por fuente).
 */
export type SeoLandingSources = {
  loadStations(): Promise<StationsResponse>;
  loadRankings(type: RankingsResponse['type'], limit: number): Promise<RankingsResponse>;
  loadDistrictRows(): Promise<DistrictSeoRow[]>;
  loadHourlyProfile(days: number): Promise<SystemHourlyProfileSeriesRow[]>;
  loadDailySeries(days: number): Promise<DailyDemandSeriesRow[]>;
  loadMonthlySeries(limitMonths: number): Promise<MonthlyDemandSeriesRow[]>;
  loadRecentConclusions(): Promise<MobilityConclusionsPayload | null>;
  loadAvailableMonths(): Promise<AvailableMonthsResponse>;
  /**
   * Resumen barato de disponibilidad para la landing de redistribucion. No
   * devuelve el informe completo: la landing publica solo necesita el numero
   * de estaciones y los porcentajes de tiempo vacia/llena.
   */
  loadAvailabilitySummary(days: number): Promise<RebalancingAvailabilitySummary | null>;
};

function warnDegraded(source: string, error: unknown): void {
  captureWarningWithContext(`SEO landing degraded: ${source} unavailable.`, {
    area: 'seo.landing',
    operation: `load-${source}`,
    dedupeKey: `seo.landing.${source}-fallback`,
    extra: { reason: String(error) },
  });
}

function emptyRankings(
  type: RankingsResponse['type'],
  limit: number,
  generatedAt: string
): RankingsResponse {
  return {
    type,
    limit,
    rankings: [],
    districtSpotlight: [],
    generatedAt,
    dataState: 'no_coverage',
  };
}

export function createLiveSeoLandingSources(nowIso: string): SeoLandingSources {
  return {
    loadStations() {
      return fetchStations().catch((error) => {
        warnDegraded('stations', error);
        return {
          stations: [],
          generatedAt: nowIso,
          dataState: 'no_coverage' as const,
        };
      });
    },

    loadRankings(type, limit) {
      return fetchRankings(type, limit).catch((error) => {
        warnDegraded('rankings', error);
        return emptyRankings(type, limit, nowIso);
      });
    },

    loadDistrictRows() {
      return getDistrictSeoRows().catch((error) => {
        warnDegraded('district-rows', error);
        return [];
      });
    },

    loadHourlyProfile(days) {
      return fetchCachedSystemHourlyProfile(days).catch((error) => {
        warnDegraded('hourly-profile', error);
        return [];
      });
    },

    loadDailySeries(days) {
      return fetchCachedDailyDemandCurve(days).catch((error) => {
        warnDegraded('daily-series', error);
        return [];
      });
    },

    loadMonthlySeries(limitMonths) {
      return fetchCachedMonthlyDemandCurve(limitMonths).catch((error) => {
        warnDegraded('monthly-series', error);
        return [];
      });
    },

    loadRecentConclusions() {
      return getDailyMobilityConclusions()
        .then((result) => result.payload)
        .catch((error) => {
          warnDegraded('mobility-conclusions', error);
          return null;
        });
    },

    loadAvailableMonths() {
      return fetchAvailableDataMonths().catch((error) => {
        warnDegraded('available-months', error);
        return { months: [], generatedAt: nowIso };
      });
    },

    loadAvailabilitySummary(days) {
      return getRebalancingAvailabilitySummary(days).catch((error) => {
        warnDegraded('rebalancing-summary', error);
        return null;
      });
    },
  };
}
