import { withCache } from '@/lib/cache/cache';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';

export type DailyHistoryRow = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  sampleCount: number;
  balanceIndex: number;
};

type RawDailyHistoryRow = {
  day: string | Date;
  demandScore: number | null;
  avgOccupancy: number | null;
  balanceIndex: number | null;
  sampleCount: number | null;
};

/**
 * La serie cerrada cambia como mucho una vez al dia (cuando corre el rollup),
 * asi que se cachea durante horas. `warmCache()` la refresca tras el job.
 */
const FINALIZED_CACHE_KEY = 'history:daily-series:finalized';
const FINALIZED_CACHE_TTL_SECONDS = 6 * 60 * 60;

/**
 * El dia en curso se calcula en vivo desde los snapshots crudos. Un dia son
 * ~200 K filas, pero se sirve de cache durante diez minutos: es un punto
 * diario (no un contador en vivo), asi que la frescura extra no se percibe y
 * el escaneo de fondo baja de ~30 a 6 ejecuciones por hora.
 */
const TODAY_CACHE_KEY = 'history:daily-series:today';
const TODAY_CACHE_TTL_SECONDS = 10 * 60;

/** Hard bound so the raw fallback cannot grow without limit if retention stalls. */
const QUERY_WINDOW_DAYS = 400;
const MAX_HISTORY_DAYS = 365;

const reportedErrors = new Set<string>();

function reportSeriesErrorOnce(error: unknown): void {
  if (reportedErrors.has('history.daily_series')) {
    return;
  }

  reportedErrors.add('history.daily_series');
  captureExceptionWithContext(error, {
    area: 'history.read_model',
    operation: 'getHistorySeries',
  });
}

function toSafeNumber(value: number | null | undefined, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeRow(row: RawDailyHistoryRow): DailyHistoryRow {
  return {
    day: String(row.day),
    demandScore: toSafeNumber(row.demandScore),
    avgOccupancy: toSafeNumber(row.avgOccupancy),
    balanceIndex: toSafeNumber(row.balanceIndex),
    sampleCount: toSafeNumber(row.sampleCount),
  };
}

/**
 * Fallback de seguridad: agrega la ventana cruda completa. Solo se usa si la
 * tabla DailySystemStat no existe todavia (despliegue antes de migrar) o esta
 * vacia (primer arranque sin backfill). Conserva el comportamiento anterior.
 */
async function fetchRawHistorySeries(): Promise<DailyHistoryRow[]> {
  const startedAt = Date.now();

  const rows = await prisma.$queryRaw<RawDailyHistoryRow[]>`
    WITH daily_station AS (
      SELECT
        ("recordedAt")::date AS bucket_date,
        "stationId",
        AVG("bikesAvailable"::float / NULLIF("bikesAvailable" + "anchorsFree", 0))
          AS "stationAvgOccupancy",
        MAX("bikesAvailable") - MIN("bikesAvailable") AS "bikesRange",
        MAX("anchorsFree") - MIN("anchorsFree") AS "anchorsRange",
        COUNT(*)::int AS "stationSamples"
      FROM "StationStatus"
      WHERE "recordedAt" >= DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
        - INTERVAL '1 day' * ${QUERY_WINDOW_DAYS}
      GROUP BY ("recordedAt")::date, "stationId"
    )
    SELECT
      TO_CHAR(bucket_date, 'YYYY-MM-DD') AS day,
      SUM("bikesRange" + "anchorsRange")::int AS "demandScore",
      AVG("stationAvgOccupancy") AS "avgOccupancy",
      AVG(CASE
        WHEN "stationAvgOccupancy" IS NULL THEN 0.5
        WHEN ABS("stationAvgOccupancy" - 0.5) >= 0.5 THEN 0
        ELSE 1 - (2 * ABS("stationAvgOccupancy" - 0.5))
      END) AS "balanceIndex",
      SUM("stationSamples")::int AS "sampleCount"
    FROM daily_station
    GROUP BY bucket_date
    ORDER BY bucket_date ASC;
  `;

  logger.warn('history.daily_series_raw_fallback', {
    durationMs: Date.now() - startedAt,
    days: rows.length,
  });

  return rows.map(normalizeRow);
}

async function fetchStoredHistorySeries(): Promise<DailyHistoryRow[]> {
  let rows: RawDailyHistoryRow[];

  try {
    rows = await prisma.$queryRaw<RawDailyHistoryRow[]>`
      SELECT
        TO_CHAR("day", 'YYYY-MM-DD') AS day,
        "demandScore",
        "avgOccupancy",
        "balanceIndex",
        "sampleCount"
      FROM "DailySystemStat"
      ORDER BY "day" ASC;
    `;
  } catch (error) {
    // La tabla llega con la migracion; si el codigo se despliega antes, el
    // endpoint sigue funcionando con la consulta cruda anterior.
    logger.warn('history.daily_system_stat_unavailable', { error });
    return fetchRawHistorySeries();
  }

  if (rows.length === 0) {
    logger.warn('history.daily_system_stat_empty');
    return fetchRawHistorySeries();
  }

  logger.info('history.daily_series_read', { days: rows.length });
  return rows.map(normalizeRow);
}

async function fetchTodayHistoryRow(): Promise<DailyHistoryRow | null> {
  const rows = await prisma.$queryRaw<RawDailyHistoryRow[]>`
    WITH daily_station AS (
      SELECT
        "stationId",
        AVG("bikesAvailable"::float / NULLIF("bikesAvailable" + "anchorsFree", 0))
          AS "stationAvgOccupancy",
        MAX("bikesAvailable") - MIN("bikesAvailable") AS "bikesRange",
        MAX("anchorsFree") - MIN("anchorsFree") AS "anchorsRange",
        COUNT(*)::int AS "stationSamples"
      FROM "StationStatus"
      WHERE "recordedAt" >= DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
      GROUP BY "stationId"
    )
    SELECT
      TO_CHAR(DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
      SUM("bikesRange" + "anchorsRange")::int AS "demandScore",
      AVG("stationAvgOccupancy") AS "avgOccupancy",
      AVG(CASE
        WHEN "stationAvgOccupancy" IS NULL THEN 0.5
        WHEN ABS("stationAvgOccupancy" - 0.5) >= 0.5 THEN 0
        ELSE 1 - (2 * ABS("stationAvgOccupancy" - 0.5))
      END) AS "balanceIndex",
      SUM("stationSamples")::int AS "sampleCount"
    FROM daily_station;
  `;

  const row = rows[0];
  return row ? normalizeRow(row) : null;
}

/**
 * Fusiona el dia en curso con la serie cerrada. El rollup diario solo finaliza
 * dias completos, asi que hoy todavia no esta en la tabla.
 */
export function mergeDailySeries(
  finalized: DailyHistoryRow[],
  today: DailyHistoryRow | null
): DailyHistoryRow[] {
  if (!today) {
    return finalized;
  }

  const last = finalized[finalized.length - 1];

  if (!last) {
    return [today];
  }

  if (last.day === today.day) {
    return [...finalized.slice(0, -1), today];
  }

  if (last.day > today.day) {
    return finalized;
  }

  return [...finalized, today];
}

function normalizeDays(days: number | undefined): number | null {
  if (days === undefined || days === null) {
    return null;
  }

  const parsed = Math.floor(Number(days));
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return Math.min(parsed, MAX_HISTORY_DAYS);
}

/**
 * Daily history series.
 *
 * Los dias cerrados salen de `DailySystemStat` (una fila por dia) y el dia en
 * curso se agrega en vivo desde los snapshots crudos. Ambas consultas se
 * cachean, y `days` solo recorta el resultado, asi que ventanas distintas
 * comparten cache.
 */
export async function getHistorySeries(options?: {
  days?: number;
}): Promise<DailyHistoryRow[]> {
  let finalized: DailyHistoryRow[];
  let today: DailyHistoryRow | null;

  try {
    [finalized, today] = await Promise.all([
      withCache(
        FINALIZED_CACHE_KEY,
        FINALIZED_CACHE_TTL_SECONDS,
        fetchStoredHistorySeries
      ),
      withCache(TODAY_CACHE_KEY, TODAY_CACHE_TTL_SECONDS, fetchTodayHistoryRow),
    ]);
  } catch (error) {
    reportSeriesErrorOnce(error);
    logger.warn('history.daily_series_failed', { error });
    return [];
  }

  const rows = mergeDailySeries(finalized, today);
  const days = normalizeDays(options?.days);

  return days === null ? rows : rows.slice(-days);
}
