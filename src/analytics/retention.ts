import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { sleep } from '@/lib/retry';
import { getWatermark, setWatermark } from '@/analytics/watermarks';

const RAW_RETENTION_DAYS = 40;
const HOURLY_RETENTION_DAYS = 365;
const ALERT_RETENTION_DAYS = 14;
const RANKING_SNAPSHOT_RETENTION_DAYS = 7;
const VACUUM_INTERVAL_DAYS = 7;

/**
 * La tabla cruda puede tener decenas de millones de filas. Un unico DELETE
 * dentro de una transaccion interactiva supera el timeout y se revierte, que es
 * justo lo que estaba pasando en produccion. Borramos por lotes ordenados por
 * `recordedAt` y sin transaccion: cada lote queda confirmado y un fallo se
 * recupera en la siguiente ejecucion.
 *
 * La retencion es de 40 dias, no 30: un mes puede tener 31 dias y el job de
 * sellado corre al dia siguiente. Con 30 dias, el primer dia del mes podria
 * borrarse antes de calcular las rachas exactas del informe. Los 40 dias dejan
 * margen para el mes completo, el sellado y un par de runs perdidos.
 */
const RAW_DELETE_BATCH_SIZE = 20_000;
const RAW_DELETE_MAX_BATCHES = 500; // 10 M de filas como maximo por run
const RAW_BATCH_PAUSE_MS = 20;

const HOURLY_DELETE_BATCH_SIZE = 50_000;
const HOURLY_DELETE_MAX_BATCHES = 100;

export interface RetentionResult {
  stationStatusDeleted: number;
  hourlyStatsDeleted: number;
  stationAlertsDeleted: number;
  stationRankingsDeleted: number;
}

async function deleteStationStatusBatch(cutoff: Date): Promise<number> {
  const deleted = await prisma.$executeRaw`
    WITH batch AS (
      SELECT "id"
      FROM "StationStatus"
      WHERE "recordedAt" < ${cutoff}
      ORDER BY "recordedAt" ASC
      LIMIT ${RAW_DELETE_BATCH_SIZE}
    )
    DELETE FROM "StationStatus" AS target
    USING batch
    WHERE target."id" = batch."id";
  `;

  return Number(deleted);
}

async function deleteHourlyStatsBatch(cutoff: Date): Promise<number> {
  const deleted = await prisma.$executeRaw`
    WITH batch AS (
      SELECT "stationId", "bucketStart"
      FROM "HourlyStationStat"
      WHERE "bucketStart" < ${cutoff}
      ORDER BY "bucketStart" ASC
      LIMIT ${HOURLY_DELETE_BATCH_SIZE}
    )
    DELETE FROM "HourlyStationStat" AS target
    USING batch
    WHERE target."stationId" = batch."stationId"
      AND target."bucketStart" = batch."bucketStart";
  `;

  return Number(deleted);
}

async function deleteStationStatusBefore(cutoff: Date): Promise<number> {
  let total = 0;

  for (let batch = 0; batch < RAW_DELETE_MAX_BATCHES; batch += 1) {
    const deleted = await deleteStationStatusBatch(cutoff);
    total += deleted;

    if (deleted < RAW_DELETE_BATCH_SIZE) {
      return total;
    }

    if (batch > 0 && batch % 25 === 0) {
      logger.info('analytics.retention.raw_batch_progress', {
        batches: batch + 1,
        deleted: total,
      });
    }

    await sleep(RAW_BATCH_PAUSE_MS);
  }

  logger.warn('analytics.retention.raw_batch_limit_reached', {
    deleted: total,
    maxBatches: RAW_DELETE_MAX_BATCHES,
    batchSize: RAW_DELETE_BATCH_SIZE,
  });

  return total;
}

async function deleteHourlyStatsBefore(cutoff: Date): Promise<number> {
  let total = 0;

  for (let batch = 0; batch < HOURLY_DELETE_MAX_BATCHES; batch += 1) {
    const deleted = await deleteHourlyStatsBatch(cutoff);
    total += deleted;

    if (deleted < HOURLY_DELETE_BATCH_SIZE) {
      return total;
    }

    await sleep(RAW_BATCH_PAUSE_MS);
  }

  logger.warn('analytics.retention.hourly_batch_limit_reached', {
    deleted: total,
    maxBatches: HOURLY_DELETE_MAX_BATCHES,
    batchSize: HOURLY_DELETE_BATCH_SIZE,
  });

  return total;
}

export async function runRetentionCleanup(): Promise<RetentionResult> {
  const startedAt = Date.now();
  const now = Date.now();
  const rawCutoff = new Date(now - RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const hourlyCutoff = new Date(now - HOURLY_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const alertCutoff = new Date(now - ALERT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const stationStatusDeleted = await deleteStationStatusBefore(rawCutoff);
  const hourlyStatsDeleted = await deleteHourlyStatsBefore(hourlyCutoff);

  const stationAlertsDeleted = Number(
    await prisma.$executeRaw`
      DELETE FROM "StationAlert"
      WHERE "generatedAt" < ${alertCutoff};
    `
  );

  const stationRankingsDeleted = Number(
    await prisma.$executeRaw`
      DELETE FROM "StationRanking"
      WHERE "windowEnd" < (
        (SELECT MAX("windowEnd") FROM "StationRanking") - ${RANKING_SNAPSHOT_RETENTION_DAYS} * INTERVAL '1 day'
      );
    `
  );

  const result: RetentionResult = {
    stationStatusDeleted,
    hourlyStatsDeleted,
    stationAlertsDeleted,
    stationRankingsDeleted,
  };

  logger.info('analytics.retention.completed', {
    ...result,
    durationMs: Date.now() - startedAt,
    rawCutoff: rawCutoff.toISOString(),
    hourlyCutoff: hourlyCutoff.toISOString(),
  });

  return result;
}

export async function runVacuumIfDue(): Promise<boolean> {
  const now = new Date();
  const lastVacuum = await getWatermark('vacuum', new Date(0));
  const nextEligibleAt = new Date(
    lastVacuum.getTime() + VACUUM_INTERVAL_DAYS * 24 * 60 * 60 * 1000
  );

  if (now < nextEligibleAt) {
    return false;
  }

  // In Postgres, regular VACUUM cannot be run inside a transaction block
  // and Autovacuum usually handles this. ANALYZE is safer and helps the planner.
  await prisma.$executeRawUnsafe('ANALYZE');
  await setWatermark('vacuum', now);
  logger.info('analytics.retention.analyze_completed');

  return true;
}
