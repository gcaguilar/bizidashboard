import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getWatermark, setWatermark } from '@/analytics/watermarks';

const RAW_RETENTION_DAYS = 30;
const HOURLY_RETENTION_DAYS = 365;
const ALERT_RETENTION_DAYS = 14;
const RANKING_SNAPSHOT_RETENTION_DAYS = 7;
const VACUUM_INTERVAL_DAYS = 7;

export interface RetentionResult {
  stationStatusDeleted: number;
  hourlyStatsDeleted: number;
  stationAlertsDeleted: number;
  stationRankingsDeleted: number;
}

export async function runRetentionCleanup(): Promise<RetentionResult> {
  const now = Date.now();
  const rawCutoff = new Date(now - RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const hourlyCutoff = new Date(now - HOURLY_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const alertCutoff = new Date(now - ALERT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const stationStatusResult = await tx.stationStatus.deleteMany({
      where: {
        recordedAt: {
          lt: rawCutoff,
        },
      },
    });

    const hourlyStatsDeleted = await tx.$executeRaw`
      DELETE FROM "HourlyStationStat"
      WHERE "bucketStart" < ${hourlyCutoff};
    `;

    const stationAlertsDeleted = await tx.$executeRaw`
      DELETE FROM "StationAlert"
      WHERE "generatedAt" < ${alertCutoff};
    `;

    const stationRankingsDeleted = await tx.$executeRaw`
      DELETE FROM "StationRanking"
      WHERE "windowEnd" < (
        (SELECT MAX("windowEnd") FROM "StationRanking") - ${RANKING_SNAPSHOT_RETENTION_DAYS} * INTERVAL '1 day'
      );
    `;

    return {
      stationStatusDeleted: stationStatusResult.count,
      hourlyStatsDeleted: Number(hourlyStatsDeleted),
      stationAlertsDeleted: Number(stationAlertsDeleted),
      stationRankingsDeleted: Number(stationRankingsDeleted),
    };
  });

  logger.info('analytics.retention.completed', {
    stationStatusDeleted: result.stationStatusDeleted,
    hourlyStatsDeleted: result.hourlyStatsDeleted,
    stationAlertsDeleted: result.stationAlertsDeleted,
    stationRankingsDeleted: result.stationRankingsDeleted,
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
