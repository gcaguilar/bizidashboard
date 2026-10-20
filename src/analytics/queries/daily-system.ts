import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfUtcDay(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

/**
 * Dias que se recalculan en exacto desde los snapshots crudos al sembrar la
 * tabla. La retencion de StationStatus es de 40 dias; 90 deja margen por si el
 * job o la retencion han estado parados. El resto del historico se rellena de
 * forma aproximada desde DailyStationStat.
 */
const DEFAULT_EXACT_BACKFILL_DAYS = 90;

export type DailySystemStatRefreshResult = {
  days: number;
  durationMs: number;
};

/**
 * Recalcula la serie diaria de red a partir de los snapshots crudos.
 *
 * Usa exactamente las mismas formulas que servia /api/history antes de existir
 * esta tabla, de modo que las cifras no cambian: la ocupacion media es la media
 * por estacion de `bikes / (bikes + anchors)` y el balance se deriva de ella.
 * Es idempotente (`ON CONFLICT DO UPDATE`), asi que se puede repetir sin miedo.
 */
export async function refreshDailySystemStats(
  from: Date,
  to: Date
): Promise<DailySystemStatRefreshResult> {
  const startedAt = Date.now();

  const affected = await prisma.$executeRaw`
    INSERT INTO "DailySystemStat" ("day", "demandScore", "avgOccupancy", "balanceIndex", "sampleCount", "updatedAt")
    WITH daily_station AS (
      SELECT
        ("recordedAt")::date AS day,
        "stationId",
        AVG("bikesAvailable"::float / NULLIF("bikesAvailable" + "anchorsFree", 0))
          AS "stationAvgOccupancy",
        MAX("bikesAvailable") - MIN("bikesAvailable") AS "bikesRange",
        MAX("anchorsFree") - MIN("anchorsFree") AS "anchorsRange",
        COUNT(*)::int AS "stationSamples"
      FROM "StationStatus"
      WHERE "recordedAt" >= ${from}
        AND "recordedAt" < ${to}
      GROUP BY ("recordedAt")::date, "stationId"
    )
    SELECT
      day,
      SUM("bikesRange" + "anchorsRange")::int,
      AVG("stationAvgOccupancy"),
      AVG(CASE
        WHEN "stationAvgOccupancy" IS NULL THEN 0.5
        WHEN ABS("stationAvgOccupancy" - 0.5) >= 0.5 THEN 0
        ELSE 1 - (2 * ABS("stationAvgOccupancy" - 0.5))
      END),
      SUM("stationSamples")::int,
      CURRENT_TIMESTAMP
    FROM daily_station
    GROUP BY day
    ON CONFLICT ("day") DO UPDATE SET
      "demandScore" = excluded."demandScore",
      "avgOccupancy" = excluded."avgOccupancy",
      "balanceIndex" = excluded."balanceIndex",
      "sampleCount" = excluded."sampleCount",
      "updatedAt" = CURRENT_TIMESTAMP;
  `;

  const result = { days: Number(affected), durationMs: Date.now() - startedAt };

  logger.info('analytics.daily_system_stats_refreshed', {
    from: from.toISOString(),
    to: to.toISOString(),
    days: result.days,
    durationMs: result.durationMs,
  });

  return result;
}

/**
 * Rellena el historico antiguo desde el rollup por estacion. `sampleCount` y
 * `demandScore` son exactos; `avgOccupancy` y `balanceIndex` son una
 * aproximacion porque DailyStationStat usa capacidad como denominador. Los
 * dias recientes se sobrescriben despues con `refreshDailySystemStats`.
 *
 * `ON CONFLICT DO NOTHING` para no pisar valores exactos ya calculados.
 */
export async function backfillDailySystemStatsFromRollup(): Promise<number> {
  const startedAt = Date.now();

  const affected = await prisma.$executeRaw`
    INSERT INTO "DailySystemStat" ("day", "demandScore", "avgOccupancy", "balanceIndex", "sampleCount", "updatedAt")
    SELECT
      "bucketDate"::date AS day,
      SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin"))::int,
      AVG("occupancyAvg"),
      AVG(CASE
        WHEN "occupancyAvg" IS NULL THEN 0.5
        WHEN ABS("occupancyAvg" - 0.5) >= 0.5 THEN 0
        ELSE 1 - (2 * ABS("occupancyAvg" - 0.5))
      END),
      SUM("sampleCount")::int,
      CURRENT_TIMESTAMP
    FROM "DailyStationStat"
    GROUP BY "bucketDate"::date
    ON CONFLICT ("day") DO NOTHING;
  `;

  const days = Number(affected);
  if (days > 0) {
    logger.info('analytics.daily_system_stats_backfilled', {
      days,
      durationMs: Date.now() - startedAt,
    });
  }

  return days;
}

export type DailySystemStatSyncResult = {
  seeded: boolean;
  days: number;
};

/**
 * Mantiene la serie al dia. Normalmente no hace nada: si el ultimo dia
 * persistido es ayer, el dia en curso se sirve en vivo y no hay nada que
 * recalcular. Si el job fallo uno o varios dias, rellena el hueco desde el
 * ultimo dia guardado, sin depender de que el watermark del rollup diario
 * vuelva a avanzar.
 *
 * Se llama al arrancar el proceso de jobs (bootstrap) y en cada pasada de
 * analitica, asi que un despliegue deja la tabla lista sin pasos manuales.
 */
export async function syncDailySystemStats(
  to: Date
): Promise<DailySystemStatSyncResult> {
  const countRows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count FROM "DailySystemStat";
  `;
  const seeded = Number(countRows[0]?.count ?? 0) === 0;

  let from: Date;

  if (seeded) {
    from = new Date(to.getTime() - DEFAULT_EXACT_BACKFILL_DAYS * DAY_MS);
  } else {
    const rows = await prisma.$queryRaw<Array<{ nextDay: string | null }>>`
      SELECT TO_CHAR(MAX("day") + 1, 'YYYY-MM-DD') AS "nextDay"
      FROM "DailySystemStat";
    `;

    const nextDay = rows[0]?.nextDay;
    from = nextDay
      ? new Date(`${nextDay}T00:00:00.000Z`)
      : new Date(to.getTime() - DEFAULT_EXACT_BACKFILL_DAYS * DAY_MS);
  }

  // La ventana exacta va primero: si falla, la tabla sigue vacia (o con el
  // hueco) y la siguiente ejecucion lo reintenta en lugar de quedarse con
  // valores aproximados. Solo dias cerrados: hoy se calcula en vivo.
  let days = 0;
  if (from < to) {
    const result = await refreshDailySystemStats(from, to);
    days = result.days;
  }

  // Idempotente y barato (DailyStationStat son decenas de miles de filas):
  // completa el historico antiguo y repara un seed que fallase a medias.
  // `ON CONFLICT DO NOTHING` no pisa los dias exactos recien calculados.
  await backfillDailySystemStatsFromRollup();

  return { seeded, days };
}
