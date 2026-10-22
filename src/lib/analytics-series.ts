import {
  getDailyDemandCurve,
  getHourlyMobilitySignals,
  getMonthlyDemandCurve,
  getStationDailyDemand,
  getStationHourlyProfiles,
  getStationsWithLatestStatus,
  getSystemHourlyProfile,
} from '@/analytics/queries/read';
import { withCache } from '@/lib/cache/cache';
import { isValidMonthKey } from '@/lib/months';

const LIVE_SERIES_TTL_SECONDS = 300;
const MONTHLY_SERIES_TTL_SECONDS = 1800;
/**
 * La red completa con su último snapshot. La colección GBFS corre cada 2 min,
 * así que 60 s de TTL no pierde frescura perceptible y evita repetir el
 * LATERAL join por estación en cada petición de `/api/stations` y
 * `/api/rankings` (predictions ya resuelve una sola fila).
 */
const STATIONS_LATEST_TTL_SECONDS = 60;

export type StationsWithLatestStatusRow = Awaited<
  ReturnType<typeof getStationsWithLatestStatus>
>[number];

export type DailyDemandSeriesRow = Awaited<ReturnType<typeof getDailyDemandCurve>>[number];
export type MonthlyDemandSeriesRow = Awaited<ReturnType<typeof getMonthlyDemandCurve>>[number];
export type SystemHourlyProfileSeriesRow = Awaited<
  ReturnType<typeof getSystemHourlyProfile>
>[number];
export type StationHourlyProfileSeriesRow = Awaited<
  ReturnType<typeof getStationHourlyProfiles>
>[number];
export type StationDailyDemandSeriesRow = Awaited<
  ReturnType<typeof getStationDailyDemand>
>[number];
export type HourlyMobilitySignalSeriesRow = Awaited<
  ReturnType<typeof getHourlyMobilitySignals>
>[number];

function normalizeMonthKey(monthKey?: string | null): string | null {
  return monthKey && isValidMonthKey(monthKey) ? monthKey : null;
}

function normalizeDays(days: number): number {
  return Math.max(1, Math.min(365, Math.floor(days)));
}

function normalizeMonthLimit(limitMonths: number): number {
  return Math.max(1, Math.min(240, Math.floor(limitMonths)));
}

export async function fetchCachedDailyDemandCurve(
  days = 30,
  monthKey?: string | null
): Promise<DailyDemandSeriesRow[]> {
  const normalizedDays = normalizeDays(days);
  const normalizedMonth = normalizeMonthKey(monthKey);

  return withCache(
    `analytics:daily-demand:days=${normalizedDays}:month=${normalizedMonth ?? 'all'}`,
    LIVE_SERIES_TTL_SECONDS,
    () => getDailyDemandCurve(normalizedDays, normalizedMonth ?? undefined)
  );
}

export async function fetchCachedMonthlyDemandCurve(
  limitMonths = 12
): Promise<MonthlyDemandSeriesRow[]> {
  const normalizedLimit = normalizeMonthLimit(limitMonths);

  return withCache(
    `analytics:monthly-demand:limit=${normalizedLimit}`,
    MONTHLY_SERIES_TTL_SECONDS,
    () => getMonthlyDemandCurve(normalizedLimit)
  );
}

export async function fetchCachedSystemHourlyProfile(
  days = 14,
  monthKey?: string | null
): Promise<SystemHourlyProfileSeriesRow[]> {
  const normalizedDays = normalizeDays(days);
  const normalizedMonth = normalizeMonthKey(monthKey);

  return withCache(
    `analytics:system-hourly-profile:days=${normalizedDays}:month=${normalizedMonth ?? 'all'}`,
    LIVE_SERIES_TTL_SECONDS,
    () => getSystemHourlyProfile(normalizedDays, normalizedMonth ?? undefined)
  );
}

export async function fetchCachedHourlyMobilitySignals(
  days = 14,
  monthKey?: string | null
): Promise<HourlyMobilitySignalSeriesRow[]> {
  const normalizedDays = normalizeDays(days);
  const normalizedMonth = normalizeMonthKey(monthKey);

  return withCache(
    `analytics:hourly-mobility-signals:days=${normalizedDays}:month=${normalizedMonth ?? 'all'}`,
    LIVE_SERIES_TTL_SECONDS,
    () => getHourlyMobilitySignals(normalizedDays, normalizedMonth ?? undefined)
  );
}

/**
 * Perfil horario por estacion para el comparador ("efecto marea"). Se cachea con
 * la misma TTL corta que el resto de series vivas porque depende de la ingesta.
 */
export async function fetchCachedStationHourlyProfiles(
  days = 30
): Promise<StationHourlyProfileSeriesRow[]> {
  const normalizedDays = normalizeDays(days);

  return withCache(
    `analytics:station-hourly-profiles:days=${normalizedDays}`,
    LIVE_SERIES_TTL_SECONDS,
    () => getStationHourlyProfiles(normalizedDays)
  );
}

/** Demanda diaria por estacion para comparaciones "hoy vs mismo dia de la semana". */
export async function fetchCachedStationDailyDemand(
  days = 90
): Promise<StationDailyDemandSeriesRow[]> {
  const normalizedDays = normalizeDays(days);

  return withCache(
    `analytics:station-daily-demand:days=${normalizedDays}`,
    LIVE_SERIES_TTL_SECONDS,
    () => getStationDailyDemand(normalizedDays)
  );
}

/**
 * Red completa con su último snapshot, servida de caché. Los jobs de rollup
 * siguen llamando a `getStationsWithLatestStatus` directamente: es su fuente
 * puntual de verdad, no un payload de API.
 */
export async function fetchCachedStationsWithLatestStatus(): Promise<StationsWithLatestStatusRow[]> {
  return withCache(
    'analytics:stations-latest',
    STATIONS_LATEST_TTL_SECONDS,
    () => getStationsWithLatestStatus()
  );
}
