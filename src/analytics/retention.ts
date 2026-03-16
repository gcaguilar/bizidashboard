import { prisma } from '@/lib/db';
import { getWatermark, setWatermark } from '@/analytics/watermarks';

const RAW_RETENTION_DAYS = 30;
const HOURLY_RETENTION_DAYS = 365;
const ALERT_RETENTION_DAYS = 14;
const VACUUM_INTERVAL_DAYS = 7;

export interface RetentionResult {
  stationStatusDeleted: number;
  hourlyStatsDeleted: number;
  stationAlertsDeleted: number;
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
    DELETE FROM HourlyStationStat
    WHERE bucketStart < ${hourlyCutoff};
  `;

  const stationAlertsDeleted = await prisma.$executeRaw`
    DELETE FROM StationAlert
    WHERE generatedAt < ${alertCutoff};
  `;

  console.log(
    `[Retention] Deleted ${stationStatusResult.count} raw rows, ${hourlyStatsDeleted} hourly rows, ${stationAlertsDeleted} alert rows`
  );

  return {
    stationStatusDeleted: stationStatusResult.count,
    hourlyStatsDeleted: Number(hourlyStatsDeleted),
    stationAlertsDeleted: Number(stationAlertsDeleted),
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

  await prisma.$executeRaw`VACUUM;`;
  await setWatermark('vacuum', now);
  console.log('[Retention] VACUUM executed');

  return true;
}
