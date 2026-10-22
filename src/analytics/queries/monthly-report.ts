import { findWatermark, setWatermark } from '@/analytics/watermarks';
import { Prisma } from '@/generated/prisma/client';
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
  monthKey: string,
  stationWindows?: readonly StationEpisodeWindow[]
): Promise<StationCriticalEpisodeRow[]> {
  if (!isValidMonthKey(monthKey)) {
    return [];
  }

  const { start, endExclusive } = getMonthBounds(monthKey);

  if (stationWindows && stationWindows.length === 0) {
    return [];
  }

  // Con ventanas por estacion solo se leen las muestras desde su ancla (una
  // muestra sin rachas abiertas), en vez de todo el mes de StationStatus. Un
  // LATERAL por estacion (con OFFSET 0 para que no se aplane en un join) fija
  // ambos extremos del rango en el indice (stationId, recordedAt); con un
  // JOIN normal la cota por estacion es una condicion entre columnas y el
  // planificador puede preferir un hash join sobre el mes entero.
  const source = stationWindows
    ? Prisma.sql`
        SELECT w."stationId", st."recordedAt", st."bikesAvailable", st."anchorsFree"
        FROM (VALUES ${stationWindowValues(stationWindows)}) AS w("stationId", "after")
        CROSS JOIN LATERAL (
          SELECT "recordedAt", "bikesAvailable", "anchorsFree"
          FROM "StationStatus"
          WHERE "stationId" = w."stationId"
            AND "recordedAt" >= GREATEST(w."after", ${start}::timestamp)
            AND "recordedAt" < ${endExclusive}::timestamp
          OFFSET 0
        ) st`
    : Prisma.sql`
        SELECT "stationId", "recordedAt", "bikesAvailable", "anchorsFree"
        FROM "StationStatus"
        WHERE "recordedAt" >= ${start}::timestamp AND "recordedAt" < ${endExclusive}::timestamp`;

  const rows = await prisma.$queryRaw<RawStationCriticalEpisodeRow[]>`
    WITH gaps AS (
      SELECT s."stationId", s."recordedAt", s."bikesAvailable", s."anchorsFree",
        ROW_NUMBER() OVER (PARTITION BY s."stationId" ORDER BY s."recordedAt")
        - ROW_NUMBER() OVER (PARTITION BY s."stationId", CASE WHEN s."bikesAvailable" <= 0 THEN 0 ELSE 1 END ORDER BY s."recordedAt") AS empty_grp,
        ROW_NUMBER() OVER (PARTITION BY s."stationId" ORDER BY s."recordedAt")
        - ROW_NUMBER() OVER (PARTITION BY s."stationId", CASE WHEN s."anchorsFree" <= 0 THEN 0 ELSE 1 END ORDER BY s."recordedAt") AS full_grp
      FROM (${source}) s
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

/** Desde que muestra (inclusive) hay que releer una estacion. */
export type StationEpisodeWindow = { stationId: string; after: Date };

function stationWindowValues(windows: readonly StationEpisodeWindow[]): Prisma.Sql {
  return Prisma.join(
    windows.map((window) => Prisma.sql`(${window.stationId}, ${window.after.toISOString()}::timestamp)`)
  );
}

/** Margen sobre el ultimo refresco por si llegan snapshots con retraso. */
const INCREMENTAL_OVERLAP_MS = 60 * 60 * 1000;
/** Hasta donde se busca el ancla; una estacion critica mas tiempo se relee entera. */
const ANCHOR_LOOKBACK_MS = 48 * 60 * 60 * 1000;
/** Con un refresco mas antiguo (job caido) se recalcula el mes completo. */
const MAX_INCREMENTAL_GAP_MS = 26 * 60 * 60 * 1000;

/**
 * Ancla de cada estacion: su ultima muestra antes de `boundary` sin bicis a
 * cero ni anclajes a cero. Ninguna racha abierta en `boundary` empieza antes,
 * asi que todo episodio anterior al ancla ya es definitivo. Sin ancla en la
 * ventana, la estacion se relee desde el inicio del mes.
 */
async function getStationEpisodeWindows(
  monthStart: Date,
  boundary: Date
): Promise<StationEpisodeWindow[]> {
  const lookbackStart = new Date(Math.max(monthStart.getTime(), boundary.getTime() - ANCHOR_LOOKBACK_MS));
  const rows = await prisma.$queryRaw<Array<{ stationId: string; anchorAt: Date | string | null }>>`
    SELECT st.id AS "stationId", a."recordedAt" AS "anchorAt"
    FROM "Station" st
    LEFT JOIN LATERAL (
      SELECT "recordedAt"
      FROM "StationStatus"
      WHERE "stationId" = st.id
        AND "recordedAt" >= ${lookbackStart.toISOString()}::timestamp
        AND "recordedAt" < ${boundary.toISOString()}::timestamp
        AND "bikesAvailable" > 0
        AND "anchorsFree" > 0
      ORDER BY "recordedAt" DESC
      LIMIT 1
    ) a ON true;
  `;

  return rows.map((row) => ({
    stationId: String(row.stationId),
    after: row.anchorAt ? toDate(row.anchorAt) : monthStart,
  }));
}

/**
 * Recalcula la tabla de episodios de un mes dentro de una transaccion. Se llama
 * cada hora para el mes en curso y al sellar el mes cerrado.
 *
 * Si el ultimo refresco es reciente, solo se releen las muestras posteriores al
 * ancla de cada estacion (ver `getStationEpisodeWindows`) y se reemplazan los
 * episodios que empiezan despues de ella; el resto del mes no cambia. Si no hay
 * refresco reciente, se borra y recalcula el mes completo.
 */
export async function refreshMonthlyCriticalEpisodes(
  monthKey: string
): Promise<{ monthKey: string; episodes: number; mode: 'full' | 'incremental' }> {
  if (!isValidMonthKey(monthKey)) {
    return { monthKey, episodes: 0, mode: 'full' };
  }

  const startedAt = Date.now();
  const watermarkKey = `critical-episodes:${monthKey}`;
  const lastRefresh = await findWatermark(watermarkKey);
  const { start, endExclusive } = getMonthBounds(monthKey);
  const monthStart = new Date(start);
  const monthEnd = new Date(endExclusive);
  const windows =
    lastRefresh !== null && startedAt - lastRefresh.getTime() <= MAX_INCREMENTAL_GAP_MS
      ? await getStationEpisodeWindows(
          monthStart,
          new Date(
            Math.min(
              monthEnd.getTime(),
              Math.max(monthStart.getTime(), lastRefresh.getTime() - INCREMENTAL_OVERLAP_MS)
            )
          )
        )
      : undefined;

  const rows = await getMonthlyEpisodeRows(monthKey, windows);
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
      if (windows) {
        if (windows.length > 0) {
          // El ancla no es critica, asi que ningun episodio empieza en ella: se
          // conservan los anteriores y se borran los que se van a reinsertar.
          // Para estaciones sin ancla `after` es el inicio del mes y se borran todos.
          await tx.$executeRaw`
            DELETE FROM "StationCriticalEpisode" e
            USING (VALUES ${stationWindowValues(windows)}) AS w("stationId", "after")
            WHERE e."monthKey" = ${monthKey}
              AND e."stationId" = w."stationId"
              AND e."startedAt" >= w."after";
          `;
        }
      } else {
        await tx.stationCriticalEpisode.deleteMany({ where: { monthKey } });
      }

      for (let index = 0; index < data.length; index += 5_000) {
        await tx.stationCriticalEpisode.createMany({
          data: data.slice(index, index + 5_000),
        });
      }
    },
    { timeout: 120_000 }
  );

  await setWatermark(watermarkKey, new Date());

  const mode = windows ? 'incremental' : 'full';
  logger.info('analytics.critical_episodes_refreshed', {
    month: monthKey,
    mode,
    episodes: data.length,
    durationMs: Date.now() - startedAt,
  });

  return { monthKey, episodes: data.length, mode };
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
