import { prisma } from '@/lib/db';
import { getWatermark, setWatermark } from '@/analytics/watermarks';

const RAW_RETENTION_DAYS = 30;
const HOURLY_RETENTION_DAYS = 365;
const ALERT_RETENTION_DAYS = 14;
const TRANSIT_SNAPSHOT_RETENTION_DAYS = Number(process.env.TRANSIT_SNAPSHOT_RETENTION_DAYS ?? 45);
const TRANSIT_IMPACT_RETENTION_DAYS = Number(process.env.TRANSIT_IMPACT_RETENTION_DAYS ?? 365);
const VACUUM_INTERVAL_DAYS = 7;

type ErrorWithMeta = {
  cause?: unknown;
  meta?: {
    driverAdapterError?: unknown;
  };
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isMissingTableError(error: unknown): boolean {
  const message = toErrorMessage(error).toLowerCase();

  if (message.includes('no such table') || message.includes('p2021')) {
    return true;
  }

  if (error && typeof error === 'object') {
    const maybeError = error as ErrorWithMeta;

    if (maybeError.cause && isMissingTableError(maybeError.cause)) {
      return true;
    }

    if (
      maybeError.meta?.driverAdapterError &&
      isMissingTableError(maybeError.meta.driverAdapterError)
    ) {
      return true;
    }
  }

  return false;
}

export interface RetentionResult {
  stationStatusDeleted: number;
  hourlyStatsDeleted: number;
  stationAlertsDeleted: number;
  transitSnapshotsDeleted: number;
  transitImpactDeleted: number;
}

export async function runRetentionCleanup(): Promise<RetentionResult> {
  const now = Date.now();
  const rawCutoff = new Date(now - RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const hourlyCutoff = new Date(now - HOURLY_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const alertCutoff = new Date(now - ALERT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const transitSnapshotCutoff = new Date(
    now - TRANSIT_SNAPSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );
  const transitImpactCutoff = new Date(
    now - TRANSIT_IMPACT_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

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

  let transitSnapshotsDeleted = 0;
  let transitImpactDeleted = 0;

  try {
    const deleted = await prisma.$executeRaw`
      DELETE FROM TransitSnapshot
      WHERE observedAt < ${transitSnapshotCutoff};
    `;

    transitSnapshotsDeleted = Number(deleted);
  } catch (error) {
    if (isMissingTableError(error)) {
      console.warn('[Retention] TransitSnapshot table missing, skipping transit snapshot cleanup');
    } else {
      throw error;
    }
  }

  try {
    const deleted = await prisma.$executeRaw`
      DELETE FROM HourlyTransitImpact
      WHERE bucketStart < ${transitImpactCutoff};
    `;

    transitImpactDeleted = Number(deleted);
  } catch (error) {
    if (isMissingTableError(error)) {
      console.warn('[Retention] HourlyTransitImpact table missing, skipping transit impact cleanup');
    } else {
      throw error;
    }
  }

  console.log(
    `[Retention] Deleted ${stationStatusResult.count} raw rows, ${hourlyStatsDeleted} hourly rows, ${stationAlertsDeleted} alert rows, ${transitSnapshotsDeleted} transit snapshots, ${transitImpactDeleted} transit impact rows`
  );

  return {
    stationStatusDeleted: stationStatusResult.count,
    hourlyStatsDeleted: Number(hourlyStatsDeleted),
    stationAlertsDeleted: Number(stationAlertsDeleted),
    transitSnapshotsDeleted,
    transitImpactDeleted,
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
