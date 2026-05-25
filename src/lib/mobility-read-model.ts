import {
  getHourlyMobilitySignals,
  getDailyDemandCurve,
  getSystemHourlyProfile,
} from '@/analytics/queries/read';
import { getSharedDatasetSnapshot, getPipelineStatusSummary } from '@/services/shared-data';
import { resolveDataState, type DataState } from '@/lib/data-state';

type HourlySignal = {
  stationId: string;
  hour: number;
  departures: number;
  arrivals: number;
  sampleCount: number;
};

type DailyDemandPoint = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  sampleCount: number;
};

type SystemHourlyProfilePoint = {
  hour: number;
  avgOccupancy: number;
  avgBikesAvailable: number;
  sampleCount: number;
};

type MobilityPayload = {
  mobilityDays: number;
  demandDays: number;
  selectedMonth: string | null;
  methodology: string;
  hourlySignals: HourlySignal[];
  dailyDemand: DailyDemandPoint[];
  systemHourlyProfile: SystemHourlyProfilePoint[];
  generatedAt: string;
  dataState: DataState;
};

export async function getMobilityData(options?: {
  mobilityDays?: number;
  demandDays?: number;
  monthKey?: string;
}): Promise<MobilityPayload> {
  const requestedMobilityDays = Math.max(1, Math.min(365, options?.mobilityDays ?? 14));
  const requestedDemandDays = Math.max(1, Math.min(365, options?.demandDays ?? 30));
  const monthKey = options?.monthKey ?? null;

  const [dataset, status] = await Promise.all([
    getSharedDatasetSnapshot().catch(() => null),
    getPipelineStatusSummary().catch(() => null),
  ]);

  const totalCoverageDays = dataset?.coverage?.totalDays ?? 0;
  const mobilityDays = Math.min(365, Math.max(requestedMobilityDays, totalCoverageDays));
  const demandDays = Math.min(365, Math.max(requestedDemandDays, totalCoverageDays));

  const [hourlySignals, dailyDemand, systemHourlyProfile] = await Promise.all([
    getHourlyMobilitySignals(mobilityDays, monthKey ?? undefined).catch(() => []),
    getDailyDemandCurve(demandDays, monthKey ?? undefined).catch(() => []),
    getSystemHourlyProfile(mobilityDays, monthKey ?? undefined).catch(() => []),
  ]);

  const hasData =
    (hourlySignals && hourlySignals.length > 0) ||
    (dailyDemand && dailyDemand.length > 0) ||
    (systemHourlyProfile && systemHourlyProfile.length > 0);

  const dataState = resolveDataState({
    hasCoverage: Boolean(dataset),
    hasData,
    isStale: status ? !status.quality.freshness.isFresh : false,
  });

  return {
    mobilityDays,
    demandDays,
    selectedMonth: monthKey,
    methodology:
      'Matriz O-D estimada con variaciones netas horarias de bicis por estacion; no representa viajes individuales observados.',
    hourlySignals: hourlySignals ?? [],
    dailyDemand: dailyDemand ?? [],
    systemHourlyProfile: systemHourlyProfile ?? [],
    generatedAt: new Date().toISOString(),
    dataState,
  };
}
