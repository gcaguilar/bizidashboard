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
import { getRollupVersion, ROLLUP_SERIES_TTL_SECONDS } from '@/lib/cache/rollup-version';
import { getMonthBounds, isValidMonthKey } from '@/lib/months';

const MONTHLY_SERIES_TTL_SECONDS = 1800;
/**
 * La red completa con su último snapshot. La colección GBFS corre cada 2 min,
 * así que 60 s de TTL no pierde frescura perceptible y evita repetir el
 * LATERAL join por estación en cada petición de `/api/stations` y
 * `/api/rankings` (predictions ya resuelve una sola fila).
 */
const STATIONS_LATEST_TTL_SECONDS = 60;

/** Un mes cerrado hace mas de dos horas ya no recibe rollups: es inmutable. */
const CLOSED_MONTH_GRACE_MS = 2 * 60 * 60 * 1000;
const CLOSED_MONTH_SERIES_TTL_SECONDS = 24 * 60 * 60;

/**
 * Clave y TTL de una serie leida de los rollups. Las abiertas llevan la version
 * de rollup (ver `rollup-version.ts`) y duran hasta el siguiente rollup; las de
 * un mes cerrado no cambian y se guardan un dia.
 */
async function rollupSeriesCache(
  baseKey: string,
  monthKey: string | null
): Promise<{ key: string; ttlSeconds: number }> {
  if (
    monthKey &&
    new Date(getMonthBounds(monthKey).endExclusive).getTime() + CLOSED_MONTH_GRACE_MS < Date.now()
  ) {
    return { key: baseKey, ttlSeconds: CLOSED_MONTH_SERIES_TTL_SECONDS };
  }

  return {
    key: `${baseKey}:rollup=${await getRollupVersion()}`,
    ttlSeconds: ROLLUP_SERIES_TTL_SECONDS,
  };
}

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

  const cache = await rollupSeriesCache(
    `analytics:daily-demand:days=${normalizedDays}:month=${normalizedMonth ?? 'all'}`,
    normalizedMonth ?? null
  );

  return withCache(cache.key, cache.ttlSeconds, () =>
    getDailyDemandCurve(normalizedDays, normalizedMonth ?? undefined)
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

  const cache = await rollupSeriesCache(
    `analytics:system-hourly-profile:days=${normalizedDays}:month=${normalizedMonth ?? 'all'}`,
    normalizedMonth ?? null
  );

  return withCache(cache.key, cache.ttlSeconds, () =>
    getSystemHourlyProfile(normalizedDays, normalizedMonth ?? undefined)
  );
}

export async function fetchCachedHourlyMobilitySignals(
  days = 14,
  monthKey?: string | null
): Promise<HourlyMobilitySignalSeriesRow[]> {
  const normalizedDays = normalizeDays(days);
  const normalizedMonth = normalizeMonthKey(monthKey);

  const cache = await rollupSeriesCache(
    `analytics:hourly-mobility-signals:days=${normalizedDays}:month=${normalizedMonth ?? 'all'}`,
    normalizedMonth ?? null
  );

  return withCache(cache.key, cache.ttlSeconds, () =>
    getHourlyMobilitySignals(normalizedDays, normalizedMonth ?? undefined)
  );
}

/** Perfil horario por estacion para el comparador ("efecto marea"). */
export async function fetchCachedStationHourlyProfiles(
  days = 30
): Promise<StationHourlyProfileSeriesRow[]> {
  const normalizedDays = normalizeDays(days);

  const cache = await rollupSeriesCache(
    `analytics:station-hourly-profiles:days=${normalizedDays}`,
    null
  );

  return withCache(cache.key, cache.ttlSeconds, () => getStationHourlyProfiles(normalizedDays));
}

/** Demanda diaria por estacion para comparaciones "hoy vs mismo dia de la semana". */
export async function fetchCachedStationDailyDemand(
  days = 90
): Promise<StationDailyDemandSeriesRow[]> {
  const normalizedDays = normalizeDays(days);

  const cache = await rollupSeriesCache(
    `analytics:station-daily-demand:days=${normalizedDays}`,
    null
  );

  return withCache(cache.key, cache.ttlSeconds, () => getStationDailyDemand(normalizedDays));
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

/**
 * `true` si el id pertenece a la red (o si la lista no esta disponible, para no
 * rechazar peticiones validas). Evita que ids inventados lleguen a la base o
 * llenen Redis de entradas vacias.
 */
export async function isKnownStationId(stationId: string): Promise<boolean> {
  const stations = await fetchCachedStationsWithLatestStatus().catch(() => []);
  return stations.length === 0 || stations.some((station) => station.id === stationId);
}

/** Cache de un rollup por estacion (patron, heatmap), versionada por rollup. */
export async function withStationRollupCache<T>(
  baseKey: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cache = await rollupSeriesCache(baseKey, null);
  return withCache(cache.key, cache.ttlSeconds, fetcher);
}
