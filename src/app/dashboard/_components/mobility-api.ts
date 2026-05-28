import { appRoutes } from '@/lib/routes';
import { fetchJson } from './useAbortableAsyncEffect';
import { type DailyDemandRow, type MobilitySignalRow } from './mobility-insights-model';

export type MobilityQueryParams = {
  mobilityDays: number;
  demandDays: number;
  month?: string | null;
};

export type MobilityPreviewData = {
  hourlySignals: MobilitySignalRow[];
  dailyDemand: DailyDemandRow[];
  systemHourlyProfile: SystemHourlyProfileRow[];
};

export type SystemHourlyProfileRow = {
  hour: number;
  avgOccupancy: number;
  avgBikesAvailable: number;
  sampleCount: number;
};

export type ValidatedMobilityPayload = {
  mobilityDays?: unknown;
  demandDays?: unknown;
  selectedMonth?: unknown;
  methodology?: unknown;
  hourlySignals?: unknown;
  dailyDemand?: unknown;
  systemHourlyProfile?: unknown;
  generatedAt?: unknown;
  dataState?: unknown;
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
): Promise<ValidatedMobilityPayload> {
  const response = await fetchJson<unknown>(`${appRoutes.api.mobility()}?${buildMobilitySearchParams(params).toString()}`, {
    signal,
    errorMessage,
  });

  if (!isValidatedMobilityPayload(response)) {
    throw new Error('Respuesta de movilidad invalida.');
  }

  return response;
}

export function normalizeMobilityPreviewData(response: ValidatedMobilityPayload): MobilityPreviewData {
  return {
    hourlySignals: normalizeArray(response.hourlySignals, isMobilitySignalRow),
    dailyDemand: normalizeArray(response.dailyDemand, isDailyDemandRow),
    systemHourlyProfile: normalizeArray(response.systemHourlyProfile, isSystemHourlyProfileRow),
  };
}

function normalizeMonthKey(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return /^\d{4}-\d{2}$/.test(value) ? value : null;
}

function isValidatedMobilityPayload(value: unknown): value is ValidatedMobilityPayload {
  if (!isRecord(value)) {
    return false;
  }

  const hasMethodology = typeof value.methodology === 'string';
  const hasPreviewArray =
    Array.isArray(value.hourlySignals) ||
    Array.isArray(value.dailyDemand) ||
    Array.isArray(value.systemHourlyProfile);

  return hasMethodology || hasPreviewArray;
}

function normalizeArray<Row>(value: unknown, isRow: (row: unknown) => row is Row): Row[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRow);
}

function isMobilitySignalRow(value: unknown): value is MobilitySignalRow {
  return (
    isRecord(value) &&
    typeof value.stationId === 'string' &&
    isFiniteNumber(value.hour) &&
    isFiniteNumber(value.departures) &&
    isFiniteNumber(value.arrivals) &&
    isFiniteNumber(value.sampleCount)
  );
}

function isDailyDemandRow(value: unknown): value is DailyDemandRow {
  return (
    isRecord(value) &&
    typeof value.day === 'string' &&
    isFiniteNumber(value.demandScore) &&
    isFiniteNumber(value.avgOccupancy) &&
    isFiniteNumber(value.sampleCount)
  );
}

function isSystemHourlyProfileRow(value: unknown): value is SystemHourlyProfileRow {
  return (
    isRecord(value) &&
    isFiniteNumber(value.hour) &&
    isFiniteNumber(value.avgOccupancy) &&
    isFiniteNumber(value.avgBikesAvailable) &&
    isFiniteNumber(value.sampleCount)
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
