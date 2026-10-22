import { getCachedJson, setCachedJson } from '@/lib/cache/cache';

/**
 * Version de los rollups analiticos (HourlyStationStat, DailyStationStat,
 * StationPattern...). El job horario la sube al terminar los rollups y las
 * series derivadas la incluyen en su clave de cache: asi duran hasta que
 * cambian los datos, en vez de caducar cada pocos minutos con datos identicos,
 * y el precalentamiento posterior rellena directamente la clave nueva.
 */
const ROLLUP_VERSION_KEY = 'analytics:rollup-version';

/** Respaldo por si el job deja de subir la version: nunca mas de dos horas. */
export const ROLLUP_SERIES_TTL_SECONDS = 2 * 60 * 60;

/**
 * Cada proceso web consulta Redis como mucho cada 30 s; tras un rollup la
 * clave nueva se adopta con ese retraso maximo.
 */
const LOCAL_MEMO_MS = 30_000;

let memo: { value: string; readAt: number } | null = null;

export async function getRollupVersion(): Promise<string> {
  const now = Date.now();
  if (memo && now - memo.readAt < LOCAL_MEMO_MS) {
    return memo.value;
  }

  const value = (await getCachedJson<string>(ROLLUP_VERSION_KEY)) ?? 'none';
  memo = { value, readAt: now };
  return value;
}

export async function bumpRollupVersion(at: Date = new Date()): Promise<string> {
  const value = at.toISOString();
  await setCachedJson(ROLLUP_VERSION_KEY, value, null);
  memo = { value, readAt: Date.now() };
  return value;
}

/** Solo para tests. */
export function resetRollupVersionMemo(): void {
  memo = null;
}
