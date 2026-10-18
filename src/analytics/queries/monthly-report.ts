import { prisma } from '@/lib/db';
import { getMonthBounds, isValidMonthKey } from '@/lib/months';
import { TIMEZONE } from '@/lib/timezone';
import { coalesceSumDemand } from './demand-sql';
import { toSerializableNumber } from './serialize';

export type MonthlyStationMetricRow = {
  stationId: string;
  demandScore: number;
  avgOccupancy: number;
  emptyHours: number;
  fullHours: number;
  totalHours: number;
  activeDays: number;
  morningEmptyHours: number;
  morningFullHours: number;
  morningHours: number;
};

export type MonthlyCriticalEpisodeRow = {
  stationId: string;
  avgEmptyEpisodeMinutes: number;
  avgFullEpisodeMinutes: number;
  maxEmptyEpisodeMinutes: number;
  maxFullEpisodeMinutes: number;
  episodeCount: number;
};

export type MonthlyNetworkHeatmapRow = {
  dayOfWeek: number;
  hour: number;
  occupancyAvg: number;
  sampleCount: number;
};

/**
 * Metricas agregadas por estacion para un mes: demanda, ocupacion, horas vacia
 * o llena y la peor franja de manana (bicis y anclajes). Es la fuente comun de
 * los rankings por barrio y de los puntos negros del informe mensual.
 *
 * `bucketStart` se guarda en UTC. El resto de analiticas por dia-y-hora del
 * proyecto (rollups de heatmap y patrones) lo interpretan en la zona local
 * (Europe/Madrid) con `getLocalBucket`; aqui hacemos la conversion en SQL para
 * que la franja de manana y el heatmap coincidan con esa convencion.
 */
export async function getMonthlyStationMetrics(monthKey: string): Promise<MonthlyStationMetricRow[]> {
  if (!isValidMonthKey(monthKey)) {
    return [];
  }

  const { start, endExclusive } = getMonthBounds(monthKey);

  const rows = await prisma.$queryRaw<
    Array<{
      stationId: string;
      demandScore: unknown;
      avgOccupancy: unknown;
      emptyHours: unknown;
      fullHours: unknown;
      totalHours: unknown;
      activeDays: unknown;
      morningEmptyHours: unknown;
      morningFullHours: unknown;
      morningHours: unknown;
    }>
  >`
    SELECT
      "stationId",
      ${coalesceSumDemand()} AS "demandScore",
      COALESCE(AVG("occupancyAvg"), 0) AS "avgOccupancy",
      COUNT(*) FILTER (WHERE "bikesAvg" <= 1) AS "emptyHours",
      COUNT(*) FILTER (WHERE "anchorsAvg" <= 1) AS "fullHours",
      COUNT(*) AS "totalHours",
      COUNT(DISTINCT ((("bucketStart" AT TIME ZONE 'UTC') AT TIME ZONE ${TIMEZONE}::text)::date)) AS "activeDays",
      COUNT(*) FILTER (
        WHERE EXTRACT(HOUR FROM ("bucketStart" AT TIME ZONE 'UTC') AT TIME ZONE ${TIMEZONE}::text)::int BETWEEN 7 AND 9
          AND "bikesAvg" <= 1
      ) AS "morningEmptyHours",
      COUNT(*) FILTER (
        WHERE EXTRACT(HOUR FROM ("bucketStart" AT TIME ZONE 'UTC') AT TIME ZONE ${TIMEZONE}::text)::int BETWEEN 7 AND 9
          AND "anchorsAvg" <= 1
      ) AS "morningFullHours",
      COUNT(*) FILTER (
        WHERE EXTRACT(HOUR FROM ("bucketStart" AT TIME ZONE 'UTC') AT TIME ZONE ${TIMEZONE}::text)::int BETWEEN 7 AND 9
      ) AS "morningHours"
    FROM "HourlyStationStat"
    WHERE "bucketStart" >= ${start}::timestamp
      AND "bucketStart" < ${endExclusive}::timestamp
    GROUP BY "stationId";
  `;

  return rows.map((row) => ({
    stationId: String(row.stationId),
    demandScore: toSerializableNumber(row.demandScore),
    avgOccupancy: toSerializableNumber(row.avgOccupancy),
    emptyHours: toSerializableNumber(row.emptyHours),
    fullHours: toSerializableNumber(row.fullHours),
    totalHours: toSerializableNumber(row.totalHours),
    activeDays: toSerializableNumber(row.activeDays),
    morningEmptyHours: toSerializableNumber(row.morningEmptyHours),
    morningFullHours: toSerializableNumber(row.morningFullHours),
    morningHours: toSerializableNumber(row.morningHours),
  }));
}

/**
 * Episodios criticos (rachas continuas sin bicis o sin anclajes) dentro del mes.
 * Es la variante mensual de `getCriticalEpisodes`, que trabaja con ventanas
 * relativas a "ahora".
 */
export async function getMonthlyCriticalEpisodes(
  monthKey: string
): Promise<Record<string, MonthlyCriticalEpisodeRow>> {
  if (!isValidMonthKey(monthKey)) {
    return {};
  }

  const { start, endExclusive } = getMonthBounds(monthKey);

  const rows = await prisma.$queryRaw<
    Array<{
      stationId: string;
      avgEmptyMinutes: unknown;
      avgFullMinutes: unknown;
      maxEmptyMinutes: unknown;
      maxFullMinutes: unknown;
      episodeCount: unknown;
    }>
  >`
    WITH gaps AS (
      SELECT "stationId", "recordedAt", "bikesAvailable", "anchorsFree",
        CASE WHEN "bikesAvailable" <= 0 THEN 0 ELSE 1 END AS empty_flag,
        CASE WHEN "anchorsFree" <= 0 THEN 0 ELSE 1 END AS full_flag,
        ROW_NUMBER() OVER (PARTITION BY "stationId" ORDER BY "recordedAt")
        - ROW_NUMBER() OVER (PARTITION BY "stationId", CASE WHEN "bikesAvailable" <= 0 THEN 0 ELSE 1 END ORDER BY "recordedAt") AS empty_grp,
        ROW_NUMBER() OVER (PARTITION BY "stationId" ORDER BY "recordedAt")
        - ROW_NUMBER() OVER (PARTITION BY "stationId", CASE WHEN "anchorsFree" <= 0 THEN 0 ELSE 1 END ORDER BY "recordedAt") AS full_grp
      FROM "StationStatus"
      WHERE "recordedAt" >= ${start}::timestamp AND "recordedAt" < ${endExclusive}::timestamp
    ),
    empty_episodes AS (
      SELECT "stationId", MIN("recordedAt") AS start_time,
             EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt")))/60 AS duration_min
      FROM gaps
      WHERE empty_flag = 0
      GROUP BY "stationId", empty_grp
      HAVING EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt")))/60 > 0
    ),
    full_episodes AS (
      SELECT "stationId", MIN("recordedAt") AS start_time,
             EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt")))/60 AS duration_min
      FROM gaps
      WHERE full_flag = 0
      GROUP BY "stationId", full_grp
      HAVING EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt")))/60 > 0
    )
    SELECT
      s.id AS "stationId",
      COALESCE(AVG(e.duration_min), 0) AS "avgEmptyMinutes",
      COALESCE(MAX(e.duration_min), 0) AS "maxEmptyMinutes",
      COALESCE(AVG(f.duration_min), 0) AS "avgFullMinutes",
      COALESCE(MAX(f.duration_min), 0) AS "maxFullMinutes",
      COUNT(DISTINCT e.start_time) + COUNT(DISTINCT f.start_time) AS "episodeCount"
    FROM "Station" s
    LEFT JOIN empty_episodes e ON s.id = e."stationId"
    LEFT JOIN full_episodes f ON s.id = f."stationId"
    GROUP BY s.id;
  `;

  const map: Record<string, MonthlyCriticalEpisodeRow> = {};

  for (const row of rows) {
    map[String(row.stationId)] = {
      stationId: String(row.stationId),
      avgEmptyEpisodeMinutes: toSerializableNumber(row.avgEmptyMinutes),
      avgFullEpisodeMinutes: toSerializableNumber(row.avgFullMinutes),
      maxEmptyEpisodeMinutes: toSerializableNumber(row.maxEmptyMinutes),
      maxFullEpisodeMinutes: toSerializableNumber(row.maxFullMinutes),
      episodeCount: toSerializableNumber(row.episodeCount),
    };
  }

  return map;
}

/** Ocupacion media de toda la red por dia de la semana y hora para un mes. */
export async function getMonthlyNetworkHeatmap(monthKey: string): Promise<MonthlyNetworkHeatmapRow[]> {
  if (!isValidMonthKey(monthKey)) {
    return [];
  }

  const { start, endExclusive } = getMonthBounds(monthKey);

  const rows = await prisma.$queryRaw<
    Array<{ dayOfWeek: unknown; hour: unknown; occupancyAvg: unknown; sampleCount: unknown }>
  >`
    SELECT
      EXTRACT(DOW FROM ("bucketStart" AT TIME ZONE 'UTC') AT TIME ZONE ${TIMEZONE}::text)::int AS "dayOfWeek",
      EXTRACT(HOUR FROM ("bucketStart" AT TIME ZONE 'UTC') AT TIME ZONE ${TIMEZONE}::text)::int AS hour,
      COALESCE(AVG("occupancyAvg"), 0) AS "occupancyAvg",
      COALESCE(SUM("sampleCount"), 0) AS "sampleCount"
    FROM "HourlyStationStat"
    WHERE "bucketStart" >= ${start}::timestamp
      AND "bucketStart" < ${endExclusive}::timestamp
    GROUP BY 1, 2
    ORDER BY "dayOfWeek" ASC, hour ASC;
  `;

  return rows.map((row) => ({
    dayOfWeek: toSerializableNumber(row.dayOfWeek),
    hour: toSerializableNumber(row.hour),
    occupancyAvg: toSerializableNumber(row.occupancyAvg),
    sampleCount: toSerializableNumber(row.sampleCount),
  }));
}
