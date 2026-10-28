/**
 * Helpers puros del agente social: fechas Europe/Madrid, agregacion por
 * distrito, anomalias robustas y seleccion de estaciones.
 *
 * Sin base de datos, sin red y sin relojes implicitos: quien necesite "ahora"
 * lo pasa como argumento. Asi los cuatro slots comparten la misma aritmetica
 * de semanas/meses y se puede probar el cambio de hora sin mocks.
 */

import { getCitizenStatus } from '@/lib/map-colors';
import { distanceMeters } from '@/lib/nearest-station';
import { median } from '@/lib/stats';
import { isValidMonthKey, previousMonthKey } from '@/lib/months';
import { TIMEZONE } from '@/lib/timezone';
import type {
  SocialDistrictDemandRow,
  SocialDistrictFrictionRow,
  SocialDistrictStats,
  SocialEveningStationProfile,
  SocialMorningStationProfile,
  SocialNearbyAlternative,
  SocialPeriodRange,
  SocialSlot,
  SocialStationCandidate,
  SocialStationSelection,
  SocialWeekRange,
} from '@/lib/social/types';

export const SOCIAL_TIMEZONE = TIMEZONE;
export const SOCIAL_ANOMALY_Z_THRESHOLD = 2.5;
export const SOCIAL_ANOMALY_FALLBACK_RATIO = 0.35;
export const SOCIAL_ANOMALY_MIN_SAMPLES = 3;

/** Horario local y expresion cron de cada slot (paso 4 los registra). */
export const SOCIAL_SLOT_SCHEDULE: Record<
  SocialSlot,
  { hour: number; minute: number; cron: string }
> = {
  morning: { hour: 8, minute: 30, cron: '30 8 * * *' },
  afternoon: { hour: 18, minute: 30, cron: '30 18 * * *' },
  weekly: { hour: 9, minute: 0, cron: '0 9 * * 1' },
  monthly: { hour: 10, minute: 0, cron: '0 10 1 * *' },
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const zonedFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getZonedFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = zonedFormatterCache.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  zonedFormatterCache.set(timeZone, formatter);
  return formatter;
}

export type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function readPart(parts: Intl.DateTimeFormatPart[], type: string): number {
  const value = parts.find((part) => part.type === type)?.value;
  return value === undefined ? Number.NaN : Number.parseInt(value, 10);
}

/** Partes de calendario/reloj en la zona indicada. */
export function getZonedParts(date: Date, timeZone: string = SOCIAL_TIMEZONE): ZonedDateParts {
  const parts = getZonedFormatter(timeZone).formatToParts(date);

  return {
    year: readPart(parts, 'year'),
    month: readPart(parts, 'month'),
    day: readPart(parts, 'day'),
    hour: readPart(parts, 'hour'),
    minute: readPart(parts, 'minute'),
    second: readPart(parts, 'second'),
  };
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** `YYYY-MM-DD` en la zona indicada (no en UTC). */
export function toDateKey(date: Date, timeZone: string = SOCIAL_TIMEZONE): string {
  const parts = getZonedParts(date, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function isValidDateKey(value: string): boolean {
  if (!DATE_KEY_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function parseDateKey(value: string): Date {
  if (!isValidDateKey(value)) {
    throw new Error(`Invalid social date key: ${value}`);
  }

  return new Date(`${value}T00:00:00.000Z`);
}

/** Suma dias a una clave de fecha sin cruzar por zonas horarias. */
export function addDaysToDateKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + Math.trunc(days));
  return date.toISOString().slice(0, 10);
}

/** Dia ISO: 1 = lunes ... 7 = domingo. */
export function getIsoWeekday(dateKey: string): number {
  const day = parseDateKey(dateKey).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Lunes de la semana que contiene `dateKey`. */
export function startOfWeek(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

/**
 * Convierte una hora de pared en Europe/Madrid a un instante UTC. El doble
 * calculo de offset resuelve tambien los cambios de hora; las horas
 * inexistentes (02:30 del salto de primavera) caen al instante posterior.
 */
export function zonedTimeToUtc(
  dateKey: string,
  hour: number,
  minute: number,
  timeZone: string = SOCIAL_TIMEZONE
): Date {
  const date = parseDateKey(dateKey);
  const localMs = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hour,
    minute,
    0,
    0
  );

  const firstGuess = localMs - getTimeZoneOffsetMs(new Date(localMs), timeZone);
  return new Date(localMs - getTimeZoneOffsetMs(new Date(firstGuess), timeZone));
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Semana completa (lunes 00:00 a lunes siguiente 00:00) que contiene la fecha. */
export function getWeekRange(
  dateKey: string,
  timeZone: string = SOCIAL_TIMEZONE
): SocialWeekRange {
  const weekStart = startOfWeek(dateKey);
  const nextWeekStart = addDaysToDateKey(weekStart, 7);

  return {
    weekStart,
    weekEnd: addDaysToDateKey(weekStart, 6),
    startIso: zonedTimeToUtc(weekStart, 0, 0, timeZone).toISOString(),
    endExclusiveIso: zonedTimeToUtc(nextWeekStart, 0, 0, timeZone).toISOString(),
  };
}

/** Ultima semana completa anterior a la que contiene `now`. */
export function getPreviousWeekRange(
  now: Date,
  timeZone: string = SOCIAL_TIMEZONE
): SocialWeekRange {
  const current = getWeekRange(toDateKey(now, timeZone), timeZone);
  return getWeekRange(addDaysToDateKey(current.weekStart, -7), timeZone);
}

/** Ventana de las ultimas `weeks` semanas completas, terminando el lunes actual. */
export function getCompletedWeeksRange(
  now: Date,
  weeks: number,
  timeZone: string = SOCIAL_TIMEZONE
): SocialPeriodRange {
  const safeWeeks = Math.max(1, Math.trunc(weeks));
  const current = getWeekRange(toDateKey(now, timeZone), timeZone);
  const startDateKey = addDaysToDateKey(current.weekStart, -7 * safeWeeks);

  return {
    startDateKey,
    endDateKey: addDaysToDateKey(current.weekStart, -1),
    startIso: zonedTimeToUtc(startDateKey, 0, 0, timeZone).toISOString(),
    endExclusiveIso: zonedTimeToUtc(current.weekStart, 0, 0, timeZone).toISOString(),
  };
}

/** `YYYY-MM` en la zona indicada. */
export function getMonthKey(date: Date, timeZone: string = SOCIAL_TIMEZONE): string {
  const parts = getZonedParts(date, timeZone);
  return `${parts.year}-${pad2(parts.month)}`;
}

export function getPreviousMonthKey(date: Date, timeZone: string = SOCIAL_TIMEZONE): string {
  return previousMonthKey(getMonthKey(date, timeZone)) ?? '';
}

/** Rango del mes natural completo en la zona indicada. */
export function getMonthRange(
  monthKey: string,
  timeZone: string = SOCIAL_TIMEZONE
): SocialPeriodRange {
  if (!isValidMonthKey(monthKey)) {
    throw new Error(`Invalid social month key: ${monthKey}`);
  }

  const [year, month] = monthKey.split('-').map(Number);
  const startDateKey = `${monthKey}-01`;
  const nextMonthStart = new Date(Date.UTC(year ?? 1970, month ?? 1, 1));
  const endExclusiveDateKey = nextMonthStart.toISOString().slice(0, 10);

  return {
    startDateKey,
    endDateKey: addDaysToDateKey(endExclusiveDateKey, -1),
    startIso: zonedTimeToUtc(startDateKey, 0, 0, timeZone).toISOString(),
    endExclusiveIso: zonedTimeToUtc(endExclusiveDateKey, 0, 0, timeZone).toISOString(),
  };
}

/** Clave de estado que identifica una ejecucion del slot. */
export function getSlotDateKey(
  slot: SocialSlot,
  now: Date,
  timeZone: string = SOCIAL_TIMEZONE
): string {
  if (slot === 'weekly') {
    return startOfWeek(toDateKey(now, timeZone));
  }

  if (slot === 'monthly') {
    const parts = getZonedParts(now, timeZone);
    return `${parts.year}-${pad2(parts.month)}`;
  }

  return toDateKey(now, timeZone);
}

/** Instante local en el que vence el slot para la fecha en curso. */
export function getSlotDueAt(
  slot: SocialSlot,
  now: Date,
  timeZone: string = SOCIAL_TIMEZONE
): Date {
  const schedule = SOCIAL_SLOT_SCHEDULE[slot];
  const dateKey =
    slot === 'weekly'
      ? startOfWeek(toDateKey(now, timeZone))
      : slot === 'monthly'
        ? `${getMonthKey(now, timeZone)}-01`
        : toDateKey(now, timeZone);

  return zonedTimeToUtc(dateKey, schedule.hour, schedule.minute, timeZone);
}

/** Dentro de la ventana de recuperacion posterior al vencimiento. */
export function isSocialSlotDue(
  slot: SocialSlot,
  now: Date,
  catchupMinutes: number,
  timeZone: string = SOCIAL_TIMEZONE
): boolean {
  const dueAt = getSlotDueAt(slot, now, timeZone);
  const elapsedMs = now.getTime() - dueAt.getTime();
  const windowMs = Math.max(0, catchupMinutes) * 60_000;

  return elapsedMs >= 0 && elapsedMs <= windowMs;
}

function compareText(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

function finiteNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

type DistrictAccumulator = {
  district: string;
  stationIds: Set<string>;
  activityIndex: number;
  previousActivityIndex: number;
  emptyHours: number;
  fullHours: number;
  totalHours: number;
};

function resolveDistrict(
  row: { stationId: string; district?: string | null },
  districtByStation?: ReadonlyMap<string, string>
): string | null {
  const direct = row.district?.trim();
  if (direct) {
    return direct;
  }

  const mapped = districtByStation?.get(row.stationId)?.trim();
  return mapped ? mapped : null;
}

/**
 * Agrega actividad y friccion por distrito. Las filas sin nombre de distrito
 * (ni en la fila ni en el mapa) se ignoran: no se inventan barrios.
 */
export function aggregateDistrictStats(input: {
  current: readonly SocialDistrictDemandRow[];
  previous?: readonly SocialDistrictDemandRow[];
  friction?: readonly SocialDistrictFrictionRow[];
  districtByStation?: ReadonlyMap<string, string>;
}): SocialDistrictStats[] {
  const accumulators = new Map<string, DistrictAccumulator>();

  const getAccumulator = (district: string): DistrictAccumulator => {
    const existing = accumulators.get(district);
    if (existing) {
      return existing;
    }

    const created: DistrictAccumulator = {
      district,
      stationIds: new Set<string>(),
      activityIndex: 0,
      previousActivityIndex: 0,
      emptyHours: 0,
      fullHours: 0,
      totalHours: 0,
    };
    accumulators.set(district, created);
    return created;
  };

  for (const row of input.current) {
    const district = resolveDistrict(row, input.districtByStation);
    if (!district) {
      continue;
    }

    const accumulator = getAccumulator(district);
    accumulator.stationIds.add(row.stationId);
    accumulator.activityIndex += finiteNumber(row.activityIndex);
  }

  for (const row of input.previous ?? []) {
    const district = resolveDistrict(row, input.districtByStation);
    if (!district) {
      continue;
    }

    const accumulator = getAccumulator(district);
    accumulator.stationIds.add(row.stationId);
    accumulator.previousActivityIndex += finiteNumber(row.activityIndex);
  }

  for (const row of input.friction ?? []) {
    const district = resolveDistrict(row, input.districtByStation);
    if (!district) {
      continue;
    }

    const accumulator = getAccumulator(district);
    accumulator.stationIds.add(row.stationId);
    accumulator.emptyHours += finiteNumber(row.emptyHours);
    accumulator.fullHours += finiteNumber(row.fullHours);
    accumulator.totalHours += finiteNumber(row.totalHours);
  }

  return Array.from(accumulators.values())
    .map((accumulator) => ({
      district: accumulator.district,
      stationCount: accumulator.stationIds.size,
      activityIndex: accumulator.activityIndex,
      previousActivityIndex: accumulator.previousActivityIndex,
      growthRatio:
        accumulator.previousActivityIndex > 0
          ? (accumulator.activityIndex - accumulator.previousActivityIndex) /
            accumulator.previousActivityIndex
          : null,
      emptyHours: accumulator.emptyHours,
      fullHours: accumulator.fullHours,
      totalHours: accumulator.totalHours,
      frictionRate:
        accumulator.totalHours > 0
          ? (accumulator.emptyHours + accumulator.fullHours) / accumulator.totalHours
          : 0,
    }))
    .sort(
      (left, right) =>
        right.activityIndex - left.activityIndex ||
        compareText(left.district, right.district)
    );
}

/**
 * Uso medio por estacion. Comparar distritos por la suma bruta premia a los que
 * tienen mas estaciones; por estacion el ranking es justo entre barrios de
 * distinto tamano.
 */
export function activityPerStation(entry: SocialDistrictStats): number {
  return entry.stationCount > 0 ? entry.activityIndex / entry.stationCount : entry.activityIndex;
}

/** Top N por uso medio por estacion; empate resuelto por nombre de distrito. */
export function topDistrictsByActivity(
  stats: readonly SocialDistrictStats[],
  limit = 3
): SocialDistrictStats[] {
  const safeLimit = Math.max(0, Math.trunc(limit));
  if (safeLimit === 0) {
    return [];
  }

  return [...stats]
    .sort(
      (left, right) =>
        activityPerStation(right) - activityPerStation(left) ||
        compareText(left.district, right.district)
    )
    .slice(0, safeLimit);
}

/** Un distrito necesita al menos este porcentaje de la mediana previa para comparar. */
const GROWTH_MIN_BASE_SHARE = 0.25;

/**
 * Distritos con referencia previa, de mayor a menor crecimiento. Se descartan
 * los que partian de una base minuscula: "sube un 80%" sobre casi nada es ruido.
 */
export function topDistrictsByGrowth(
  stats: readonly SocialDistrictStats[],
  limit = 1
): SocialDistrictStats[] {
  const safeLimit = Math.max(0, Math.trunc(limit));
  if (safeLimit === 0) {
    return [];
  }

  const previous = stats
    .map((entry) => entry.previousActivityIndex)
    .filter((value) => value > 0)
    .sort((left, right) => left - right);
  const median =
    previous.length === 0
      ? 0
      : previous.length % 2 === 1
        ? previous[(previous.length - 1) / 2]!
        : (previous[previous.length / 2 - 1]! + previous[previous.length / 2]!) / 2;
  const minBase = median * GROWTH_MIN_BASE_SHARE;

  return stats
    .filter((entry) => entry.growthRatio !== null && entry.previousActivityIndex >= minBase)
    .sort(
      (left, right) =>
        (right.growthRatio ?? 0) - (left.growthRatio ?? 0) ||
        compareText(left.district, right.district)
    )
    .slice(0, safeLimit);
}

/** Distritos con horas observadas, de mayor a menor tasa de friccion. */
export function topDistrictsByFriction(
  stats: readonly SocialDistrictStats[],
  limit = 1
): SocialDistrictStats[] {
  const safeLimit = Math.max(0, Math.trunc(limit));
  if (safeLimit === 0) {
    return [];
  }

  return stats
    .filter((entry) => entry.totalHours > 0)
    .sort(
      (left, right) =>
        right.frictionRate - left.frictionRate ||
        compareText(left.district, right.district)
    )
    .slice(0, safeLimit);
}

export type RobustBaseline = {
  median: number;
  mad: number;
  sampleCount: number;
};

export type RobustAnomalyMethod = 'mad' | 'fallback';

export type RobustAnomaly = {
  value: number;
  baseline: number;
  mad: number;
  zScore: number | null;
  deviationRatio: number;
  isAnomaly: boolean;
  direction: 'up' | 'down';
  method: RobustAnomalyMethod;
};

export type RobustAnomalyOptions = {
  zThreshold?: number;
  fallbackRatio?: number;
  minSamples?: number;
};

/** Mediana de las desviaciones absolutas respecto a la mediana. */
export function medianAbsoluteDeviation(values: readonly number[], center?: number): number {
  if (values.length === 0) {
    return 0;
  }

  const baseline = center ?? median([...values]);
  return median(values.map((value) => Math.abs(value - baseline)));
}

export function buildRobustBaseline(
  values: readonly number[],
  minSamples = SOCIAL_ANOMALY_MIN_SAMPLES
): RobustBaseline | null {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length < Math.max(1, Math.trunc(minSamples))) {
    return null;
  }

  const center = median(valid);
  return {
    median: center,
    mad: medianAbsoluteDeviation(valid, center),
    sampleCount: valid.length,
  };
}

/**
 * Desviacion robusta de un valor frente a su referencia (mismo dia de la
 * semana y hora). Con MAD > 0 usa z = 0.6745 * desviacion / MAD y el umbral 2.5;
 * con MAD = 0 cae al 35 % de desviacion relativa, igual que
 * `service-anomalies.ts`. Devuelve `null` si no hay muestras suficientes.
 */
export function evaluateRobustAnomaly(
  value: number,
  baselineValues: readonly number[],
  options: RobustAnomalyOptions = {}
): RobustAnomaly | null {
  if (!Number.isFinite(value)) {
    return null;
  }

  const baseline = buildRobustBaseline(
    baselineValues,
    options.minSamples ?? SOCIAL_ANOMALY_MIN_SAMPLES
  );
  if (!baseline) {
    return null;
  }

  const zThreshold = options.zThreshold ?? SOCIAL_ANOMALY_Z_THRESHOLD;
  const fallbackRatio = options.fallbackRatio ?? SOCIAL_ANOMALY_FALLBACK_RATIO;
  const deviationRatio =
    baseline.median > 0 ? (value - baseline.median) / baseline.median : 0;

  let zScore: number | null = null;
  let method: RobustAnomalyMethod;
  let isAnomaly: boolean;

  if (baseline.mad > 0) {
    zScore = (0.6745 * (value - baseline.median)) / baseline.mad;
    method = 'mad';
    isAnomaly = Math.abs(zScore) >= zThreshold;
  } else {
    method = 'fallback';
    isAnomaly = Math.abs(deviationRatio) >= fallbackRatio;
  }

  return {
    value,
    baseline: baseline.median,
    mad: baseline.mad,
    zScore,
    deviationRatio,
    isAnomaly,
    direction: value >= baseline.median ? 'up' : 'down',
    method,
  };
}

export type HourlyActivitySample = {
  /** Dia ISO: 1 = lunes ... 7 = domingo. */
  weekday: number;
  hour: number;
  activityIndex: number;
};

/** Muestras de la misma hora y dia de la semana para construir la referencia. */
export function collectHourlyActivityBaseline(
  samples: readonly HourlyActivitySample[],
  weekday: number,
  hour: number
): number[] {
  return samples
    .filter(
      (sample) =>
        sample.weekday === weekday &&
        sample.hour === hour &&
        Number.isFinite(sample.activityIndex)
    )
    .map((sample) => sample.activityIndex);
}

export function evaluateHourlyActivityAnomaly(
  value: number,
  samples: readonly HourlyActivitySample[],
  weekday: number,
  hour: number,
  options: RobustAnomalyOptions = {}
): RobustAnomaly | null {
  return evaluateRobustAnomaly(
    value,
    collectHourlyActivityBaseline(samples, weekday, hour),
    options
  );
}

/**
 * Cohorte de estaciones "habituales" para una franja: las `cohortSize` con
 * mayor proporcion historica de horas agotadas. Sin perfiles se usa la red
 * completa para no dejar la story vacia por falta de historico.
 */
function buildCohort<T extends SocialStationCandidate>(
  stations: readonly T[],
  profiles: ReadonlyArray<{ stationId: string; share: number }>,
  cohortSize: number
): { cohort: T[]; shareOf: (station: T) => number } {
  const stationById = new Map(stations.map((station) => [station.id, station]));
  const profileById = new Map<string, { stationId: string; share: number }>();
  for (const profile of profiles) {
    if (stationById.has(profile.stationId)) {
      profileById.set(profile.stationId, profile);
    }
  }

  if (profileById.size === 0) {
    return {
      cohort: [...stations].sort((left, right) => compareText(left.id, right.id)),
      shareOf: () => 0,
    };
  }

  const ranked = Array.from(profileById.values()).sort(
    (left, right) =>
      finiteNumber(right.share) - finiteNumber(left.share) ||
      compareText(left.stationId, right.stationId)
  );
  const shareByStation = new Map(
    ranked.map((profile) => [profile.stationId, finiteNumber(profile.share)])
  );

  return {
    cohort: ranked
      .slice(0, cohortSize)
      .map((profile) => stationById.get(profile.stationId))
      .filter((station): station is T => station !== undefined),
    shareOf: (station) => shareByStation.get(station.id) ?? 0,
  };
}

/**
 * Selecciona las estaciones de la story de manana:
 *
 * 1. Cohorte de estaciones habituales por `emptyShare` historico (top `cohortSize`).
 * 2. Dentro de la cohorte, las `limit` con `bikesAvailable <= 0`.
 * 3. Si no hay ninguna agotada, las `limit` con estado ciudadano `low`
 *    (poca disponibilidad).
 *
 * Todo orden es determinista; si no hay perfiles se usa la red completa como
 * cohorte para no dejar la story vacia por falta de historico.
 */
export function selectMorningStations<T extends SocialStationCandidate>(input: {
  stations: readonly T[];
  profiles?: readonly SocialMorningStationProfile[];
  limit?: number;
  cohortSize?: number;
}): SocialStationSelection<T> {
  const limit = Math.max(1, Math.trunc(input.limit ?? 3));
  const cohortSize = Math.max(limit, Math.trunc(input.cohortSize ?? 40));
  const { cohort, shareOf: emptyShare } = buildCohort(
    input.stations,
    (input.profiles ?? []).map((profile) => ({
      stationId: profile.stationId,
      share: profile.emptyShare,
    })),
    cohortSize
  );

  const emptyStations = cohort
    .filter((station) => station.bikesAvailable <= 0)
    .sort(
      (left, right) =>
        left.bikesAvailable - right.bikesAvailable ||
        emptyShare(right) - emptyShare(left) ||
        compareText(left.id, right.id)
    );

  if (emptyStations.length > 0) {
    return { mode: 'empty', stations: emptyStations.slice(0, limit) };
  }

  const lowStations = cohort
    .filter((station) => getCitizenStatus(station).level === 'low')
    .sort(
      (left, right) =>
        left.bikesAvailable - right.bikesAvailable ||
        left.anchorsFree - right.anchorsFree ||
        compareText(left.id, right.id)
    );

  if (lowStations.length > 0) {
    return { mode: 'low', stations: lowStations.slice(0, limit) };
  }

  return { mode: 'none', stations: [] };
}

/**
 * Espejo de la manana para la story de la tarde ("donde dejar la bici"):
 *
 * 1. Cohorte de estaciones que suelen quedarse sin huecos (`fullShare`).
 * 2. Dentro de la cohorte, las `limit` con `anchorsFree <= 0`.
 * 3. Si no hay ninguna llena, las `limit` con 1 o 2 huecos libres.
 */
export function selectEveningStations<T extends SocialStationCandidate>(input: {
  stations: readonly T[];
  profiles?: readonly SocialEveningStationProfile[];
  limit?: number;
  cohortSize?: number;
}): SocialStationSelection<T> {
  const limit = Math.max(1, Math.trunc(input.limit ?? 3));
  const cohortSize = Math.max(limit, Math.trunc(input.cohortSize ?? 40));
  const { cohort, shareOf: fullShare } = buildCohort(
    input.stations,
    (input.profiles ?? []).map((profile) => ({
      stationId: profile.stationId,
      share: profile.fullShare,
    })),
    cohortSize
  );

  const fullStations = cohort
    .filter((station) => station.capacity > 0 && station.anchorsFree <= 0)
    .sort(
      (left, right) =>
        fullShare(right) - fullShare(left) || compareText(left.id, right.id)
    );

  if (fullStations.length > 0) {
    return { mode: 'full', stations: fullStations.slice(0, limit) };
  }

  const lowStations = cohort
    .filter((station) => station.capacity > 0 && station.anchorsFree > 0 && station.anchorsFree < 3)
    .sort(
      (left, right) =>
        left.anchorsFree - right.anchorsFree ||
        fullShare(right) - fullShare(left) ||
        compareText(left.id, right.id)
    );

  if (lowStations.length > 0) {
    return { mode: 'low', stations: lowStations.slice(0, limit) };
  }

  return { mode: 'none', stations: [] };
}

/** Distancia maxima para que una estacion sea una alternativa util a pie. */
const ALTERNATIVE_MAX_METERS = 600;
/** Bicis o huecos minimos: con 1 o 2 es probable que ya no queden al leer la story. */
const ALTERNATIVE_MIN_AVAILABLE = 3;

/**
 * Estacion mas cercana con bicis (`bikes`) o huecos (`anchors`) suficientes para
 * sugerir en lugar de `origin`.
 * Distancia en linea recta (se muestra como "a unos X m"). Devuelve `null` si
 * no hay ninguna dentro de la distancia util: mejor no sugerir nada que mandar
 * a alguien a un kilometro.
 */
export function findNearbyAlternative<
  T extends SocialStationCandidate & { lat: number; lon: number },
>(
  origin: T,
  stations: readonly T[],
  options: { kind?: 'bikes' | 'anchors'; minAvailable?: number; maxMeters?: number } = {}
): SocialNearbyAlternative | null {
  const kind = options.kind ?? 'bikes';
  const minAvailable = options.minAvailable ?? ALTERNATIVE_MIN_AVAILABLE;
  const availableOf = (station: T): number =>
    kind === 'bikes' ? station.bikesAvailable : station.anchorsFree;
  const maxMeters = options.maxMeters ?? ALTERNATIVE_MAX_METERS;
  let best: { station: T; meters: number } | null = null;

  for (const station of stations) {
    if (station.id === origin.id || !(availableOf(station) >= minAvailable)) {
      continue;
    }

    const meters = distanceMeters(origin, station);
    if (
      Number.isFinite(meters) &&
      meters <= maxMeters &&
      (!best ||
        meters < best.meters ||
        (meters === best.meters && compareText(station.id, best.station.id) < 0))
    ) {
      best = { station, meters };
    }
  }

  if (!best) {
    return null;
  }

  return {
    fromStationId: origin.id,
    name: best.station.name,
    kind,
    distanceMeters: Math.max(10, Math.round(best.meters / 10) * 10),
    available: availableOf(best.station),
  };
}
