/**
 * Lecturas adicionales para el agente social.
 *
 * Solo anade consultas; no cambia las existentes. Todas devuelven filas ya
 * coaccionadas y ordenadas de forma determinista. La aritmetica de fechas vive
 * en `src/lib/social/data.ts`, no en SQL, para compartirla con los tests.
 */

import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { getCompletedWeeksRange } from '@/lib/social/data';
import { TIMEZONE } from '@/lib/timezone';

import { sumDemand } from './demand-sql';
import { localHour } from './local-time-sql';
import { toSerializableNumber } from './serialize';

const DEFAULT_MORNING_PROFILE_WEEKS = 8;
const DEFAULT_ACTIVITY_BASELINE_WEEKS = 12;
const DEFAULT_FRICTION_WEEKS = 2;

/** `EXTRACT(ISODOW ...)` local: 1 = lunes ... 7 = domingo. */
function localIsoDow(column = 'bucketStart'): Prisma.Sql {
  return Prisma.sql`EXTRACT(ISODOW FROM ((${Prisma.raw(`"${column}"`)} AT TIME ZONE 'UTC') AT TIME ZONE ${TIMEZONE}::text))::int`;
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(normalized);
    const parsed = new Date(hasZone ? normalized : `${normalized}Z`);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }

  return String(value);
}

export type WeekdayMorningProfileRow = {
  stationId: string;
  /** Dia ISO: 1 = lunes ... 5 = viernes. */
  isoWeekday: number;
  hour: number;
  /** Proporcion de horas agregadas con `bikesMax <= 0`. */
  emptyShare: number;
  sampleCount: number;
};

/**
 * Perfil de manana por estacion para los dias laborables (07:00-08:59). Es la
 * cohorte de "estaciones clave" que usa la story de las 08:30.
 */
export async function getWeekdayMorningProfiles(
  weeks = DEFAULT_MORNING_PROFILE_WEEKS
): Promise<WeekdayMorningProfileRow[]> {
  const safeWeeks = Math.max(1, Math.min(26, Math.floor(weeks)));

  const rows = await prisma.$queryRaw<Array<{
    stationId: unknown;
    isoWeekday: unknown;
    hour: unknown;
    emptyShare: unknown;
    sampleCount: unknown;
  }>>`
    SELECT
      "stationId",
      ${localIsoDow()} AS "isoWeekday",
      ${localHour()} AS hour,
      AVG(CASE WHEN "bikesMax" <= 0 THEN 1.0 ELSE 0.0 END) AS "emptyShare",
      SUM("sampleCount")::int AS "sampleCount"
    FROM "HourlyStationStat"
    WHERE "bucketStart" >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 day' * ${safeWeeks * 7}
      AND ${localIsoDow()} <= 5
      AND ${localHour()} BETWEEN 7 AND 8
    GROUP BY 1, 2, 3
    ORDER BY 1, 2, 3;
  `;

  return rows.map((row) => ({
    stationId: String(row.stationId),
    isoWeekday: toSerializableNumber(row.isoWeekday),
    hour: toSerializableNumber(row.hour),
    emptyShare: toSerializableNumber(row.emptyShare),
    sampleCount: toSerializableNumber(row.sampleCount),
  }));
}

export type RecentBikeSampleRow = {
  stationId: string;
  /** Instante de la lectura, en ISO UTC. */
  recordedAt: string;
  bikesAvailable: number;
};

/**
 * Lecturas de bicis de todas las estaciones desde `since`, para medir el ritmo
 * de bajada de la ultima media hora. Una sola consulta por el indice
 * `(stationId, recordedAt)`; la logica de ritmo vive en `src/lib/social/data.ts`.
 */
export async function getRecentBikeSamples(since: Date): Promise<RecentBikeSampleRow[]> {
  const rows = await prisma.stationStatus.findMany({
    where: { recordedAt: { gte: since } },
    select: { stationId: true, recordedAt: true, bikesAvailable: true },
    orderBy: [{ stationId: 'asc' }, { recordedAt: 'asc' }],
  });

  return rows.map((row) => ({
    stationId: row.stationId,
    recordedAt: row.recordedAt.toISOString(),
    bikesAvailable: row.bikesAvailable,
  }));
}

export type WeekdayEveningProfileRow = {
  stationId: string;
  /** Dia ISO: 1 = lunes ... 5 = viernes. */
  isoWeekday: number;
  hour: number;
  /** Proporcion de horas agregadas con `anchorsMax <= 0`. */
  fullShare: number;
  sampleCount: number;
};

/**
 * Perfil de tarde por estacion para los dias laborables (17:00-18:59). Es la
 * cohorte de estaciones que suelen quedarse sin huecos en la story de las 18:30
 * ("donde dejar la bici"), espejo de `getWeekdayMorningProfiles`.
 */
export async function getWeekdayEveningProfiles(
  weeks = DEFAULT_MORNING_PROFILE_WEEKS
): Promise<WeekdayEveningProfileRow[]> {
  const safeWeeks = Math.max(1, Math.min(26, Math.floor(weeks)));

  const rows = await prisma.$queryRaw<Array<{
    stationId: unknown;
    isoWeekday: unknown;
    hour: unknown;
    fullShare: unknown;
    sampleCount: unknown;
  }>>`
    SELECT
      "stationId",
      ${localIsoDow()} AS "isoWeekday",
      ${localHour()} AS hour,
      AVG(CASE WHEN "anchorsMax" <= 0 THEN 1.0 ELSE 0.0 END) AS "fullShare",
      SUM("sampleCount")::int AS "sampleCount"
    FROM "HourlyStationStat"
    WHERE "bucketStart" >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 day' * ${safeWeeks * 7}
      AND ${localIsoDow()} <= 5
      AND ${localHour()} BETWEEN 17 AND 18
    GROUP BY 1, 2, 3
    ORDER BY 1, 2, 3;
  `;

  return rows.map((row) => ({
    stationId: String(row.stationId),
    isoWeekday: toSerializableNumber(row.isoWeekday),
    hour: toSerializableNumber(row.hour),
    fullShare: toSerializableNumber(row.fullShare),
    sampleCount: toSerializableNumber(row.sampleCount),
  }));
}

export type LatestHourMobilityRow = {
  stationId: string;
  /** Inicio del bucket horario local, en ISO UTC. */
  bucketStart: string;
  hour: number;
  departures: number;
  arrivals: number;
  /**
   * Indice de actividad de la estacion en ese bucket con la misma formula que
   * `sumDemand()` (bicis + anclajes). Permite comparar la hora actual con la
   * referencia historica de `getHourlyNetworkActivityBaseline` sin mezclar
   * unidades.
   */
  activityIndex: number;
  sampleCount: number;
};

/**
 * Movimiento estimado por estacion en la ultima hora local completa.
 *
 * El corte es la hora anterior a `now` (no la hora en curso) y se calcula una
 * sola vez en el CTE `latest`; despues se filtra ese unico bucket. El LAG se
 * evalua sobre dos horas de contexto para no perder la referencia.
 */
export async function getLatestCompletedHourMobility(): Promise<LatestHourMobilityRow[]> {
  const rows = await prisma.$queryRaw<Array<{
    stationId: unknown;
    bucketStart: unknown;
    hour: unknown;
    departures: unknown;
    arrivals: unknown;
    activityIndex: unknown;
    sampleCount: unknown;
  }>>`
    WITH latest AS (
      SELECT MAX("bucketStart") AS "latestStart"
      FROM "HourlyStationStat"
      WHERE "bucketStart" <= (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 hour'
    ),
    with_lag AS (
      SELECT
        "stationId",
        "bucketStart",
        "bikesAvg" - LAG("bikesAvg") OVER (
          PARTITION BY "stationId"
          ORDER BY "bucketStart"
        ) AS delta,
        "bikesMin",
        "bikesMax",
        "anchorsMin",
        "anchorsMax"
      FROM "HourlyStationStat"
      WHERE "bucketStart" >= (SELECT "latestStart" FROM latest) - INTERVAL '2 hours'
        AND "bucketStart" <= (SELECT "latestStart" FROM latest)
    ),
    hourly AS (
      SELECT
        "stationId",
        "bucketStart",
        ${localHour()} AS hour,
        SUM(CASE WHEN delta < 0 THEN ABS(delta) ELSE 0 END) AS departures,
        SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END) AS arrivals,
        ${sumDemand()} AS "activityIndex",
        COUNT(*)::int AS "sampleCount"
      FROM with_lag
      WHERE "bucketStart" = (SELECT "latestStart" FROM latest)
        AND delta IS NOT NULL
      GROUP BY 1, 2, 3
    )
    SELECT "stationId", "bucketStart", hour, departures, arrivals, "activityIndex", "sampleCount"
    FROM hourly
    ORDER BY "stationId" ASC;
  `;

  return rows.map((row) => ({
    stationId: String(row.stationId),
    bucketStart: toIsoString(row.bucketStart),
    hour: toSerializableNumber(row.hour),
    departures: toSerializableNumber(row.departures),
    arrivals: toSerializableNumber(row.arrivals),
    activityIndex: toSerializableNumber(row.activityIndex),
    sampleCount: toSerializableNumber(row.sampleCount),
  }));
}

export type HourlyNetworkActivityBaselineRow = {
  /** Dia ISO: 1 = lunes ... 7 = domingo. */
  isoWeekday: number;
  hour: number;
  bucketStart: string;
  activityIndex: number;
  sampleCount: number;
};

/**
 * Actividad de red por bucket horario durante las ultimas `weeks` semanas
 * completas anteriores a `now`. El consumidor agrupa por dia ISO + hora y
 * calcula mediana/MAD; mantener las muestras (en vez de agregar aqui) evita
 * inventar una referencia con una sola pasada.
 */
export async function getHourlyNetworkActivityBaseline(
  weeks = DEFAULT_ACTIVITY_BASELINE_WEEKS,
  now: Date = new Date()
): Promise<HourlyNetworkActivityBaselineRow[]> {
  const safeWeeks = Math.max(1, Math.min(52, Math.floor(weeks)));
  const range = getCompletedWeeksRange(now, safeWeeks);

  const rows = await prisma.$queryRaw<Array<{
    isoWeekday: unknown;
    hour: unknown;
    bucketStart: unknown;
    activityIndex: unknown;
    sampleCount: unknown;
  }>>`
    WITH buckets AS (
      SELECT
        "bucketStart",
        ${sumDemand()} AS "activityIndex",
        SUM("sampleCount")::int AS "sampleCount"
      FROM "HourlyStationStat"
      WHERE "bucketStart" >= ${range.startIso}::timestamp
        AND "bucketStart" < ${range.endExclusiveIso}::timestamp
      GROUP BY "bucketStart"
    )
    SELECT
      ${localIsoDow('bucketStart')} AS "isoWeekday",
      ${localHour('bucketStart')} AS hour,
      "bucketStart",
      "activityIndex",
      "sampleCount"
    FROM buckets
    ORDER BY "bucketStart" ASC;
  `;

  return rows.map((row) => ({
    isoWeekday: toSerializableNumber(row.isoWeekday),
    hour: toSerializableNumber(row.hour),
    bucketStart: toIsoString(row.bucketStart),
    activityIndex: toSerializableNumber(row.activityIndex),
    sampleCount: toSerializableNumber(row.sampleCount),
  }));
}

export type WeeklyStationFrictionRow = {
  stationId: string;
  emptyHours: number;
  fullHours: number;
  totalHours: number;
};

/**
 * Horas vacia/llena por estacion en las ultimas `weeks` semanas completas
 * anteriores a `now`. Para el carrusel semanal del lunes, `weeks = 2` cubre la
 * semana analizada y la anterior.
 */
export async function getWeeklyStationFriction(
  weeks = DEFAULT_FRICTION_WEEKS,
  now: Date = new Date()
): Promise<WeeklyStationFrictionRow[]> {
  const safeWeeks = Math.max(1, Math.min(26, Math.floor(weeks)));
  const range = getCompletedWeeksRange(now, safeWeeks);

  const rows = await prisma.$queryRaw<Array<{
    stationId: unknown;
    emptyHours: unknown;
    fullHours: unknown;
    totalHours: unknown;
  }>>`
    SELECT
      "stationId",
      COUNT(*) FILTER (WHERE "bikesMin" <= 0)::int AS "emptyHours",
      COUNT(*) FILTER (WHERE "anchorsMin" <= 0)::int AS "fullHours",
      COUNT(*)::int AS "totalHours"
    FROM "HourlyStationStat"
    WHERE "bucketStart" >= ${range.startIso}::timestamp
      AND "bucketStart" < ${range.endExclusiveIso}::timestamp
    GROUP BY "stationId"
    ORDER BY "stationId" ASC;
  `;

  return rows.map((row) => ({
    stationId: String(row.stationId),
    emptyHours: toSerializableNumber(row.emptyHours),
    fullHours: toSerializableNumber(row.fullHours),
    totalHours: toSerializableNumber(row.totalHours),
  }));
}
