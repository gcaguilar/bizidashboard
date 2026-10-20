import { findWatermark, setWatermark } from '@/analytics/watermarks';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
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

export type StationCriticalEpisodeKind = 'empty' | 'full';

export type StationCriticalEpisodeRow = {
  stationId: string;
  kind: StationCriticalEpisodeKind;
  startedAt: Date;
  endedAt: Date;
  durationMinutes: number;
};

type RawStationCriticalEpisodeRow = {
  stationId: string;
  kind: string;
  startedAt: string | Date;
  endedAt: string | Date;
  durationMinutes: unknown;
};

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Extrae las rachas exactas del mes con los timestamps reales de StationStatus.
 * La duracion se calcula con los minutos reales (con decimales); no se aproxima
 * con los rollups horarios.
 */
export async function getMonthlyEpisodeRows(
  monthKey: string
): Promise<StationCriticalEpisodeRow[]> {
  if (!isValidMonthKey(monthKey)) {
    return [];
  }

  const { start, endExclusive } = getMonthBounds(monthKey);

  const rows = await prisma.$queryRaw<RawStationCriticalEpisodeRow[]>`
    WITH gaps AS (
      SELECT "stationId", "recordedAt", "bikesAvailable", "anchorsFree",
        ROW_NUMBER() OVER (PARTITION BY "stationId" ORDER BY "recordedAt")
        - ROW_NUMBER() OVER (PARTITION BY "stationId", CASE WHEN "bikesAvailable" <= 0 THEN 0 ELSE 1 END ORDER BY "recordedAt") AS empty_grp,
        ROW_NUMBER() OVER (PARTITION BY "stationId" ORDER BY "recordedAt")
        - ROW_NUMBER() OVER (PARTITION BY "stationId", CASE WHEN "anchorsFree" <= 0 THEN 0 ELSE 1 END ORDER BY "recordedAt") AS full_grp
      FROM "StationStatus"
      WHERE "recordedAt" >= ${start}::timestamp AND "recordedAt" < ${endExclusive}::timestamp
    ),
    empty_episodes AS (
      SELECT "stationId", 'empty' AS kind, MIN("recordedAt") AS "startedAt", MAX("recordedAt") AS "endedAt",
        EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt"))) / 60 AS "durationMinutes"
      FROM gaps
      WHERE "bikesAvailable" <= 0
      GROUP BY "stationId", empty_grp
      HAVING MAX("recordedAt") > MIN("recordedAt")
    ),
    full_episodes AS (
      SELECT "stationId", 'full' AS kind, MIN("recordedAt") AS "startedAt", MAX("recordedAt") AS "endedAt",
        EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt"))) / 60 AS "durationMinutes"
      FROM gaps
      WHERE "anchorsFree" <= 0
      GROUP BY "stationId", full_grp
      HAVING MAX("recordedAt") > MIN("recordedAt")
    )
    SELECT * FROM empty_episodes
    UNION ALL
    SELECT * FROM full_episodes;
  `;

  return rows.map((row) => ({
    stationId: String(row.stationId),
    kind: row.kind === 'full' ? 'full' : 'empty',
    startedAt: toDate(row.startedAt),
    endedAt: toDate(row.endedAt),
    durationMinutes: toSerializableNumber(row.durationMinutes),
  }));
}

function aggregateEpisodeRows(
  rows: StationCriticalEpisodeRow[]
): Record<string, MonthlyCriticalEpisodeRow> {
  const byStation = new Map<string, { empty: number[]; full: number[] }>();

  for (const row of rows) {
    const entry = byStation.get(row.stationId) ?? { empty: [], full: [] };
    entry[row.kind].push(row.durationMinutes);
    byStation.set(row.stationId, entry);
  }

  const map: Record<string, MonthlyCriticalEpisodeRow> = {};

  for (const [stationId, entry] of byStation) {
    const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
    const max = (values: number[]) =>
      values.reduce((highest, value) => Math.max(highest, value), 0);

    map[stationId] = {
      stationId,
      avgEmptyEpisodeMinutes: entry.empty.length > 0 ? sum(entry.empty) / entry.empty.length : 0,
      avgFullEpisodeMinutes: entry.full.length > 0 ? sum(entry.full) / entry.full.length : 0,
      maxEmptyEpisodeMinutes: max(entry.empty),
      maxFullEpisodeMinutes: max(entry.full),
      episodeCount: entry.empty.length + entry.full.length,
    };
  }

  return map;
}

async function getPersistedMonthlyEpisodes(
  monthKey: string
): Promise<Record<string, MonthlyCriticalEpisodeRow>> {
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
    SELECT
      "stationId",
      COALESCE(AVG("durationMinutes") FILTER (WHERE "kind" = 'empty'), 0) AS "avgEmptyMinutes",
      COALESCE(MAX("durationMinutes") FILTER (WHERE "kind" = 'empty'), 0) AS "maxEmptyMinutes",
      COALESCE(AVG("durationMinutes") FILTER (WHERE "kind" = 'full'), 0) AS "avgFullMinutes",
      COALESCE(MAX("durationMinutes") FILTER (WHERE "kind" = 'full'), 0) AS "maxFullMinutes",
      COUNT(*) AS "episodeCount"
    FROM "StationCriticalEpisode"
    WHERE "monthKey" = ${monthKey}
    GROUP BY "stationId";
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

/**
 * Recalcula la tabla de episodios de un mes. Es idempotente: borra e inserta
 * dentro de una transaccion corta. Se llama al sellar el mes y, para el mes en
 * curso, desde el job horario.
 */
export async function refreshMonthlyCriticalEpisodes(
  monthKey: string
): Promise<{ monthKey: string; episodes: number }> {
  if (!isValidMonthKey(monthKey)) {
    return { monthKey, episodes: 0 };
  }

  const startedAt = Date.now();
  const rows = await getMonthlyEpisodeRows(monthKey);
  const data = rows.map((row) => ({
    stationId: row.stationId,
    kind: row.kind,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    durationMinutes: row.durationMinutes,
    monthKey,
  }));

  await prisma.$transaction(
    async (tx) => {
      await tx.stationCriticalEpisode.deleteMany({ where: { monthKey } });

      for (let index = 0; index < data.length; index += 5_000) {
        await tx.stationCriticalEpisode.createMany({
          data: data.slice(index, index + 5_000),
        });
      }
    },
    { timeout: 120_000 }
  );

  await setWatermark(`critical-episodes:${monthKey}`, new Date());

  logger.info('analytics.critical_episodes_refreshed', {
    month: monthKey,
    episodes: data.length,
    durationMs: Date.now() - startedAt,
  });

  return { monthKey, episodes: data.length };
}

/**
 * Episodios criticos del mes. Usa la tabla precalculada si el job ya la ha
 * refrescado; si no (primer arranque o backfill), calcula las rachas exactas
 * desde StationStatus.
 */
export async function getMonthlyCriticalEpisodes(
  monthKey: string
): Promise<Record<string, MonthlyCriticalEpisodeRow>> {
  if (!isValidMonthKey(monthKey)) {
    return {};
  }

  const watermark = await findWatermark(`critical-episodes:${monthKey}`);

  if (watermark) {
    try {
      return await getPersistedMonthlyEpisodes(monthKey);
    } catch (error) {
      logger.warn('analytics.critical_episodes_read_failed', { month: monthKey, error });
    }
  }

  return aggregateEpisodeRows(await getMonthlyEpisodeRows(monthKey));
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
