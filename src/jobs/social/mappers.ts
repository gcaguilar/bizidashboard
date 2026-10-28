/**
 * Mapeadores puros entre las filas de analitica y los contratos del agente
 * social.
 *
 * Aqui no hay base de datos, red ni relojes implicitos: cada funcion recibe
 * filas ya leidas y devuelve objetos del dominio social. Asi los cuatro slots
 * comparten la misma aritmetica (pesos, distritos, ventanas) y los tests pueden
 * cubrirla sin mocks.
 */

import { ANALYTICS_WINDOWS } from '@/analytics/types';
import type { StationDailyDemandRow } from '@/analytics/queries/read';
import type { CriticalEpisodeRow } from '@/analytics/queries/rebalancing';
import type {
  HourlyNetworkActivityBaselineRow,
  LatestHourMobilityRow,
  WeekdayEveningProfileRow,
  WeekdayMorningProfileRow,
  WeekdayStationProfileRow,
  WeeklyStationFrictionRow,
} from '@/analytics/queries/social';
import type { NetworkHealth } from '@/lib/network-health';
import type { ServiceCause } from '@/lib/service-calendar';
import {
  getIsoWeekday,
  SOCIAL_TIMEZONE,
  toDateKey,
  type HourlyActivitySample,
  type RobustAnomaly,
} from '@/lib/social/data';
import type {
  SocialAfternoonAlert,
  SocialAfternoonAnomaly,
  SocialAfternoonEpisode,
} from '@/lib/social/story';
import type {
  SocialCause,
  SocialDistrictDemandRow,
  SocialDistrictFrictionRow,
  SocialEveningStationProfile,
  SocialMorningStationProfile,
  SocialNetworkContext,
  SocialStationCandidate,
  SocialStationProfile,
} from '@/lib/social/types';

/** La story diaria exige un snapshot de hace 10 minutos o menos. */
export const SOCIAL_SNAPSHOT_MAX_AGE_MS = 10 * 60_000;

/**
 * La ultima hora completa la publica el rollup horario con ~10 min de retraso.
 * A las 08:30/18:30 el bucket mas reciente tiene ~1,5 h; 2 h deja margen para
 * un retraso puntual sin publicar movimiento de una hora ya vieja.
 */
export const SOCIAL_MOBILITY_MAX_AGE_MS = 2 * 60 * 60_000;

type TimestampedStation = { recordedAt: string };

type StationPoint = { id: string; lat: number; lon: number };

export type SocialActiveAlertRow = {
  stationId: string;
  alertType: string;
  severity: number;
  metricValue: number;
  windowHours: number;
};

function finite(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function nonNegative(value: number | null | undefined): number {
  return Math.max(0, finite(value));
}

function clampShare(value: number | null | undefined): number {
  return Math.min(1, nonNegative(value));
}

function compareText(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

function resolveStationName(
  stationId: string,
  stationNameById: ReadonlyMap<string, string> | undefined
): string {
  const name = stationNameById?.get(stationId)?.trim();
  return name ? name : stationId;
}

type ShareRow = { stationId: string; share: number; sampleCount: number };

function aggregateShares(
  rows: readonly ShareRow[]
): Array<{ stationId: string; share: number; sampleCount: number }> {
  const accumulators = new Map<
    string,
    { weighted: number; weight: number; shares: number; entries: number }
  >();

  for (const row of rows) {
    const stationId = row.stationId?.trim();
    if (!stationId) {
      continue;
    }

    const weight = nonNegative(row.sampleCount);
    const share = clampShare(row.share);
    const accumulator = accumulators.get(stationId) ?? {
      weighted: 0,
      weight: 0,
      shares: 0,
      entries: 0,
    };

    accumulator.weighted += share * weight;
    accumulator.weight += weight;
    accumulator.shares += share;
    accumulator.entries += 1;
    accumulators.set(stationId, accumulator);
  }

  return Array.from(accumulators, ([stationId, accumulator]) => ({
    stationId,
    share:
      accumulator.weight > 0
        ? accumulator.weighted / accumulator.weight
        : accumulator.entries > 0
          ? accumulator.shares / accumulator.entries
          : 0,
    sampleCount: accumulator.weight,
  })).sort((left, right) => compareText(left.stationId, right.stationId));
}

/**
 * Un perfil por estacion a partir de las filas de dia laborable ponderando
 * `emptyShare` por `sampleCount`. Sin muestras cae a la media simple para no
 * inventar un cero.
 */
export function aggregateMorningProfiles(
  rows: readonly WeekdayMorningProfileRow[]
): SocialMorningStationProfile[] {
  return aggregateShares(
    rows.map((row) => ({
      stationId: row.stationId,
      share: row.emptyShare,
      sampleCount: row.sampleCount,
    }))
  ).map(({ stationId, share, sampleCount }) => ({ stationId, emptyShare: share, sampleCount }));
}

/** Igual que `aggregateMorningProfiles`, con la proporcion de horas sin huecos. */
export function aggregateEveningProfiles(
  rows: readonly WeekdayEveningProfileRow[]
): SocialEveningStationProfile[] {
  return aggregateShares(
    rows.map((row) => ({
      stationId: row.stationId,
      share: row.fullShare,
      sampleCount: row.sampleCount,
    }))
  ).map(({ stationId, share, sampleCount }) => ({ stationId, fullShare: share, sampleCount }));
}

/**
 * Un perfil por estacion con las dos caras (`emptyShare` y `fullShare`), para
 * las stories que miran su lado principal y el contrario con la misma franja.
 */
export function aggregateStationProfiles(
  rows: readonly WeekdayStationProfileRow[]
): SocialStationProfile[] {
  const empty = aggregateShares(
    rows.map((row) => ({
      stationId: row.stationId,
      share: row.emptyShare,
      sampleCount: row.sampleCount,
    }))
  );
  const fullByStation = new Map(
    aggregateShares(
      rows.map((row) => ({
        stationId: row.stationId,
        share: row.fullShare,
        sampleCount: row.sampleCount,
      }))
    ).map((entry) => [entry.stationId, entry.share])
  );

  return empty.map(({ stationId, share, sampleCount }) => ({
    stationId,
    emptyShare: share,
    fullShare: fullByStation.get(stationId) ?? 0,
    sampleCount,
  }));
}

/** Instante mas reciente del snapshot; `null` si ninguna fila es valida. */
export function getLatestRecordedAt(
  stations: readonly TimestampedStation[]
): string | null {
  let latest: { iso: string; ms: number } | null = null;

  for (const station of stations) {
    const ms = Date.parse(station.recordedAt);
    if (!Number.isFinite(ms)) {
      continue;
    }

    if (!latest || ms > latest.ms) {
      latest = { iso: station.recordedAt, ms };
    }
  }

  return latest?.iso ?? null;
}

/**
 * `true` si el snapshot mas reciente no supera `maxAgeMs`. Un reloj adelantado
 * (edad negativa) se considera fresco para no bloquear por desfase de reloj.
 */
export function isStationSnapshotFresh(
  stations: readonly TimestampedStation[],
  now: Date,
  maxAgeMs: number = SOCIAL_SNAPSHOT_MAX_AGE_MS
): boolean {
  const latest = getLatestRecordedAt(stations);
  if (!latest) {
    return false;
  }

  const ageMs = now.getTime() - Date.parse(latest);
  return Number.isFinite(ageMs) && ageMs <= Math.max(0, maxAgeMs);
}

/**
 * `bucketStart` mas reciente de la hora completa. Devuelve `null` si ninguna
 * fila tiene una fecha valida.
 */
export function getLatestMobilityBucketStart(
  rows: readonly Pick<LatestHourMobilityRow, 'bucketStart'>[]
): string | null {
  let latest: { iso: string; ms: number } | null = null;

  for (const row of rows) {
    const ms = Date.parse(row.bucketStart);
    if (!Number.isFinite(ms)) {
      continue;
    }

    if (!latest || ms > latest.ms) {
      latest = { iso: row.bucketStart, ms };
    }
  }

  return latest?.iso ?? null;
}

/**
 * La hora completa que alimenta distritos y anomalias no puede ser vieja. Si
 * el rollup horario se ha quedado atras, la story se salta en vez de mezclar
 * un snapshot fresco con movimiento de hace horas.
 */
export function isLatestMobilityFresh(
  rows: readonly Pick<LatestHourMobilityRow, 'bucketStart'>[],
  now: Date,
  maxAgeMs: number = SOCIAL_MOBILITY_MAX_AGE_MS
): boolean {
  const latest = getLatestMobilityBucketStart(rows);
  if (!latest) {
    return false;
  }

  const ageMs = now.getTime() - Date.parse(latest);
  return Number.isFinite(ageMs) && ageMs <= Math.max(0, maxAgeMs);
}

/**
 * Demanda por estacion de la ultima hora completa, expresada en salidas
 * estimadas. El distrito se resuelve por el mapa de estaciones; las estaciones
 * sin distrito se conservan con `district: null` y la agregacion las ignora.
 */
export function mapLatestHourDemandRows(
  rows: readonly LatestHourMobilityRow[],
  districtByStation?: ReadonlyMap<string, string>
): SocialDistrictDemandRow[] {
  return rows
    .map((row) => ({
      stationId: row.stationId,
      district: districtByStation?.get(row.stationId) ?? null,
      activityIndex: nonNegative(row.departures),
    }))
    .sort((left, right) => compareText(left.stationId, right.stationId));
}

/** Suma de la actividad de la ultima hora completa (bicis + anclajes). */
export function sumLatestHourActivity(
  rows: readonly LatestHourMobilityRow[]
): number {
  return rows.reduce((total, row) => total + nonNegative(row.activityIndex), 0);
}

/** Dia ISO y hora local del bucket mas reciente, para la referencia horaria. */
export function getLatestBucketContext(
  rows: readonly LatestHourMobilityRow[],
  timeZone: string = SOCIAL_TIMEZONE
): { weekday: number; hour: number } | null {
  const latestStart = getLatestMobilityBucketStart(rows);
  if (!latestStart) {
    return null;
  }

  const latestMs = Date.parse(latestStart);
  const row = rows.find(
    (entry) => Date.parse(entry.bucketStart) === latestMs
  );
  if (!row) {
    return null;
  }

  const bucketStart = new Date(latestStart);
  if (Number.isNaN(bucketStart.getTime())) {
    return null;
  }

  return {
    weekday: getIsoWeekday(toDateKey(bucketStart, timeZone)),
    hour: Math.trunc(finite(row.hour)),
  };
}

/** Muestras horarias para `evaluateHourlyActivityAnomaly`. */
export function mapHourlyActivitySamples(
  rows: readonly HourlyNetworkActivityBaselineRow[]
): HourlyActivitySample[] {
  return rows.map((row) => ({
    weekday: Math.trunc(finite(row.isoWeekday)),
    hour: Math.trunc(finite(row.hour)),
    activityIndex: finite(row.activityIndex),
  }));
}

/**
 * Solo se convierte en anomalia social un pico al alza; una caida o una
 * referencia insuficiente no da titular.
 */
export function mapAfternoonAnomaly(input: {
  anomaly: RobustAnomaly | null;
  weekday: number;
  hour: number;
}): SocialAfternoonAnomaly | null {
  const anomaly = input.anomaly;
  if (!anomaly || !anomaly.isAnomaly || anomaly.direction !== 'up') {
    return null;
  }

  return {
    weekday: input.weekday,
    hour: input.hour,
    value: anomaly.value,
    baseline: anomaly.baseline,
    deviationRatio: anomaly.deviationRatio,
    zScore: anomaly.zScore,
    direction: 'up',
    isAnomaly: true,
  };
}

/**
 * Demanda diaria sumada por estacion dentro de una ventana de fechas
 * (`YYYY-MM-DD`, inclusiva). Las claves de fecha se comparan como texto porque
 * ese formato ordena lexicograficamente igual que el calendario.
 */
export function mapDailyDemandRows(
  rows: readonly StationDailyDemandRow[],
  options: {
    startDateKey: string;
    endDateKey: string;
    districtByStation?: ReadonlyMap<string, string>;
  }
): SocialDistrictDemandRow[] {
  const totals = new Map<string, number>();

  for (const row of rows) {
    if (row.day < options.startDateKey || row.day > options.endDateKey) {
      continue;
    }

    totals.set(
      row.stationId,
      (totals.get(row.stationId) ?? 0) + nonNegative(row.demandScore)
    );
  }

  return Array.from(totals, ([stationId, activityIndex]) => ({
    stationId,
    district: options.districtByStation?.get(stationId) ?? null,
    activityIndex,
  })).sort((left, right) => compareText(left.stationId, right.stationId));
}

/** Friccion semanal por estacion con su distrito resuelto. */
export function mapWeeklyFrictionRows(
  rows: readonly WeeklyStationFrictionRow[],
  districtByStation?: ReadonlyMap<string, string>
): SocialDistrictFrictionRow[] {
  return rows
    .map((row) => ({
      stationId: row.stationId,
      district: districtByStation?.get(row.stationId) ?? null,
      emptyHours: nonNegative(row.emptyHours),
      fullHours: nonNegative(row.fullHours),
      totalHours: nonNegative(row.totalHours),
    }))
    .sort((left, right) => compareText(left.stationId, right.stationId));
}

/**
 * Alertas activas dentro de la ventana editorial de 3 h, con el nombre de la
 * estacion y ordenadas de mas a menos severa.
 */
export function mapActiveAlerts(
  alerts: readonly SocialActiveAlertRow[],
  stationNameById?: ReadonlyMap<string, string>
): SocialAfternoonAlert[] {
  return alerts
    .filter(
      (alert) =>
        Number.isFinite(alert.windowHours) &&
        alert.windowHours > 0 &&
        alert.windowHours <= ANALYTICS_WINDOWS.alertWindowHours
    )
    .map((alert) => ({
      stationId: alert.stationId,
      stationName: resolveStationName(alert.stationId, stationNameById),
      alertType: String(alert.alertType),
      severity: finite(alert.severity),
      metricValue: finite(alert.metricValue),
      windowHours: alert.windowHours,
    }))
    .sort(
      (left, right) =>
        right.severity - left.severity ||
        left.metricValue - right.metricValue ||
        compareText(left.stationId, right.stationId)
    );
}

/**
 * Rachas criticas por estacion. Se elige el tipo con mas minutos; en empate
 * manda "sin bicis" (vacía), que es el caso que mas afecta al servicio.
 */
export function mapCriticalEpisodes(
  episodes: Record<string, CriticalEpisodeRow>,
  stationNameById?: ReadonlyMap<string, string>
): SocialAfternoonEpisode[] {
  const mapped: SocialAfternoonEpisode[] = [];

  for (const [stationId, row] of Object.entries(episodes)) {
    const emptyMinutes = nonNegative(row.maxEmptyEpisodeMinutes);
    const fullMinutes = nonNegative(row.maxFullEpisodeMinutes);
    const maxMinutes = Math.max(emptyMinutes, fullMinutes);

    if (maxMinutes <= 0) {
      continue;
    }

    mapped.push({
      stationId,
      stationName: resolveStationName(stationId, stationNameById),
      kind: fullMinutes > emptyMinutes ? 'full' : 'empty',
      maxMinutes,
    });
  }

  return mapped.sort(
    (left, right) =>
      right.maxMinutes - left.maxMinutes ||
      compareText(left.stationId, right.stationId)
  );
}

/**
 * Una racha historica solo puede ser titular si la estacion sigue en ese
 * estado ahora mismo. `getCriticalEpisodes(1)` agrega las ultimas 24 h e
 * incluye rachas ya resueltas; sin este filtro la story de la tarde podria
 * decir que una estacion lleva horas sin bicis cuando ya se ha repuesto.
 */
export function filterCurrentEpisodes(
  episodes: readonly SocialAfternoonEpisode[],
  stations: readonly SocialStationCandidate[]
): SocialAfternoonEpisode[] {
  const stationById = new Map(stations.map((station) => [station.id, station]));

  return episodes.filter((episode) => {
    const station = stationById.get(episode.stationId);
    if (!station) {
      return false;
    }

    return episode.kind === 'empty'
      ? station.bikesAvailable <= 0
      : station.anchorsFree <= 0;
  });
}

export function mapNetworkHealth(health: NetworkHealth): SocialNetworkContext {
  return {
    level: health.level,
    label: health.label,
    description: health.description,
    criticalStationsCount: nonNegative(health.criticalStationsCount),
    totalStations: nonNegative(health.totalStations),
    unavailableShare: clampShare(health.unavailableShare),
  };
}

export function mapServiceCause(
  cause: ServiceCause | null | undefined
): SocialCause | null {
  const label = cause?.label?.trim();
  if (!label) {
    return null;
  }

  return { label, kind: cause?.kind };
}

/** Puntos minimos que necesita `buildStationDistrictMap`. */
export function toStationPoints(
  stations: readonly StationPoint[]
): StationPoint[] {
  return stations.map((station) => ({
    id: station.id,
    lat: station.lat,
    lon: station.lon,
  }));
}
