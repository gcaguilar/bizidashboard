import { prisma } from '@/lib/db';
import { getWatermark, setWatermark } from '@/analytics/watermarks';

const RAW_RETENTION_DAYS = 30;
const HOURLY_RETENTION_DAYS = 365;
const ALERT_RETENTION_DAYS = 14;
/** Rankings store one row per station per hourly windowEnd; keep recent snapshots only. */
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

  const stationStatusResult = await prisma.stationStatus.deleteMany({
    where: {
      recordedAt: {
        lt: rawCutoff,
      },
    },
  });

  const hourlyStatsDeleted = await prisma.$executeRaw`
    DELETE FROM "HourlyStationStat"
    WHERE "bucketStart" < ${hourlyCutoff};
  `;

  const stationAlertsDeleted = await prisma.$executeRaw`
    DELETE FROM "StationAlert"
    WHERE "generatedAt" < ${alertCutoff};
  `;

  const stationRankingsDeleted = await prisma.$executeRaw`
    DELETE FROM "StationRanking"
    WHERE "windowEnd" < (
      (SELECT MAX("windowEnd") FROM "StationRanking") - ${RANKING_SNAPSHOT_RETENTION_DAYS} * INTERVAL '1 day'
    );
  `;

  console.log(
    `[Retention] Deleted ${stationStatusResult.count} raw rows, ${hourlyStatsDeleted} hourly rows, ${stationAlertsDeleted} alert rows, ${stationRankingsDeleted} ranking snapshots`
  );

  return {
    stationStatusDeleted: stationStatusResult.count,
    hourlyStatsDeleted: Number(hourlyStatsDeleted),
    stationAlertsDeleted: Number(stationAlertsDeleted),
    stationRankingsDeleted: Number(stationRankingsDeleted),
  };
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
  console.log('[Retention] ANALYZE executed');

  return true;
}
