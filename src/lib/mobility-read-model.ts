import {
  getHourlyMobilitySignals,
  getDailyDemandCurve,
  getSystemHourlyProfile,
} from '@/analytics/queries/read';
import { withCache } from '@/lib/cache/cache';
import { getRollupVersion, ROLLUP_SERIES_TTL_SECONDS } from '@/lib/cache/rollup-version';
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

/**
 * Ventanas canónicas de `/api/mobility`. Cuantizar hacia abajo acota el espacio
 * de claves de caché a 7 × 7 × 13 = 637 combinaciones: sin esto, cada valor de
 * `mobilityDays`/`demandDays` entre 1 y 365 disparaba su propio `LAG` sobre
 * hasta ~1,1 M de filas de `HourlyStationStat` y su propia entrada en Redis.
 * La respuesta informa la ventana realmente consultada, así que el contrato
 * sigue siendo honesto (pedir 45 días devuelve la ventana de 30).
 */
export const MOBILITY_DAY_PRESETS = [1, 7, 14, 30, 90, 180, 365] as const;

/** Redondea hacia abajo al preset ≤ valor pedido (mismo criterio que la cobertura). */
export function quantizeMobilityDays(requestedDays: number): number {
  const normalized = Math.max(1, Math.floor(requestedDays));
  let resolved: number = MOBILITY_DAY_PRESETS[0];

  for (const preset of MOBILITY_DAY_PRESETS) {
    if (preset <= normalized) {
      resolved = preset;
    }
  }

  return resolved;
}

function clampRequestedDays(value: number | undefined, fallback: number): number {
  return Math.max(1, Math.min(365, Math.floor(value ?? fallback)));
}

/**
 * The requested window is the source of truth: querying more days than asked
 * made every dashboard preset (24h, 7d, mes) scan the whole retained history.
 * Coverage only caps the window when there is less data than requested.
 */
function resolveWindowDays(requestedDays: number, availableDays: number): number {
  if (availableDays <= 0) {
    return requestedDays;
  }
  return Math.min(requestedDays, availableDays);
}

export async function getMobilityData(options?: {
  mobilityDays?: number;
  demandDays?: number;
  monthKey?: string;
}): Promise<MobilityPayload> {
  const requestedMobilityDays = quantizeMobilityDays(
    clampRequestedDays(options?.mobilityDays, 14)
  );
  const requestedDemandDays = quantizeMobilityDays(
    clampRequestedDays(options?.demandDays, 30)
  );
  const monthKey = options?.monthKey ?? null;

  // Las series salen de los rollups: la clave lleva su version y dura hasta el
  // siguiente rollup. La frescura de la ingesta cambia cada pocos minutos, asi
  // que `dataState` se resuelve fuera de la entrada cacheada.
  const cacheKey = `mobility:mobilityDays=${requestedMobilityDays}:demandDays=${requestedDemandDays}:month=${monthKey ?? 'all'}:rollup=${await getRollupVersion()}`;

  const [series, status] = await Promise.all([
    withCache(cacheKey, ROLLUP_SERIES_TTL_SECONDS, () =>
      loadMobilitySeries(requestedMobilityDays, requestedDemandDays, monthKey, 'strict')
    ).catch(() =>
      // Un fallo no se cachea durante toda la ventana del rollup: se responde
      // con lo que se pueda leer (series vacias si falla) y se reintenta luego.
      loadMobilitySeries(requestedMobilityDays, requestedDemandDays, monthKey, 'tolerant')
    ),
    getPipelineStatusSummary().catch(() => null),
  ]);

  const { hasCoverage, ...payload } = series;
  const hasData =
    payload.hourlySignals.length > 0 ||
    payload.dailyDemand.length > 0 ||
    payload.systemHourlyProfile.length > 0;

  return {
    ...payload,
    dataState: resolveDataState({
      hasCoverage,
      hasData,
      isStale: status ? !status.quality.freshness.isFresh : false,
    }),
  };
}

async function loadMobilitySeries(
  requestedMobilityDays: number,
  requestedDemandDays: number,
  monthKey: string | null,
  mode: 'strict' | 'tolerant'
): Promise<Omit<MobilityPayload, 'dataState'> & { hasCoverage: boolean }> {
  const tolerate = <T>(promise: Promise<T[]>): Promise<T[]> =>
    mode === 'tolerant' ? promise.catch(() => []) : promise;
  const dataset =
    mode === 'tolerant'
      ? await getSharedDatasetSnapshot().catch(() => null)
      : await getSharedDatasetSnapshot();

  const totalCoverageDays = dataset?.coverage?.totalDays ?? 0;
  const mobilityDays = resolveWindowDays(requestedMobilityDays, totalCoverageDays);
  const demandDays = resolveWindowDays(requestedDemandDays, totalCoverageDays);

  const [hourlySignals, dailyDemand, systemHourlyProfile] = await Promise.all([
    tolerate(getHourlyMobilitySignals(mobilityDays, monthKey ?? undefined)),
    tolerate(getDailyDemandCurve(demandDays, monthKey ?? undefined)),
    tolerate(getSystemHourlyProfile(mobilityDays, monthKey ?? undefined)),
  ]);

  return {
    hasCoverage: Boolean(dataset),
    mobilityDays,
    demandDays,
    selectedMonth: monthKey,
    methodology:
      'Matriz O-D estimada con variaciones netas horarias de bicis por estación; no representa viajes individuales observados.',
    hourlySignals: hourlySignals ?? [],
    dailyDemand: dailyDemand ?? [],
    systemHourlyProfile: systemHourlyProfile ?? [],
    generatedAt: new Date().toISOString(),
  };
}
