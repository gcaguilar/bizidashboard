import { appRoutes } from '@/lib/routes';
import { fetchJson } from './useAbortableAsyncEffect';
import {
  isMobilityResponse,
  type DailyDemandRow,
  type MobilityResponse,
  type MobilitySignalRow,
} from './mobility-insights-model';

export type MobilityQueryParams = {
  mobilityDays: number;
  demandDays: number;
  month?: string | null;
};

export type MobilityPreviewData = {
  hourlySignals: MobilitySignalRow[];
  dailyDemand: DailyDemandRow[];
  systemHourlyProfile: Array<{
    hour: number;
    avgOccupancy: number;
    avgBikesAvailable: number;
    sampleCount: number;
  }>;
};

export const EMPTY_MOBILITY_PREVIEW: MobilityPreviewData = {
  hourlySignals: [],
  dailyDemand: [],
  systemHourlyProfile: [],
};

export function buildMobilitySearchParams(params: MobilityQueryParams): URLSearchParams {
  const searchParams = new URLSearchParams({
    mobilityDays: String(params.mobilityDays),
    demandDays: String(params.demandDays),
  });

  const selectedMonth = normalizeMonthKey(params.month);

  if (selectedMonth) {
    searchParams.set('month', selectedMonth);
  }

  return searchParams;
}

export async function loadMobilityData(
  signal: AbortSignal,
  params: MobilityQueryParams,
  errorMessage = 'No se pudo cargar la vista previa de flujo.'
): Promise<MobilityResponse> {
  const response = await fetchJson<unknown>(`${appRoutes.api.mobility()}?${buildMobilitySearchParams(params).toString()}`, {
    signal,
    errorMessage,
  });

  if (!isMobilityResponse(response)) {
    throw new Error('Respuesta de movilidad invalida.');
  }

  return response;
}

export function normalizeMobilityPreviewData(response: MobilityResponse): MobilityPreviewData {
  return {
    hourlySignals: Array.isArray(response.hourlySignals) ? response.hourlySignals : [],
    dailyDemand: Array.isArray(response.dailyDemand) ? response.dailyDemand : [],
    systemHourlyProfile: Array.isArray(response.systemHourlyProfile) ? response.systemHourlyProfile : [],
  };
}

function normalizeMonthKey(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return /^\d{4}-\d{2}$/.test(value) ? value : null;
}
