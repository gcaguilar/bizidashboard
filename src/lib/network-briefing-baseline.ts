import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { NetworkBriefingBaseline } from '@/lib/network-briefing';

type BaselineRow = {
  bucketStart: Date;
  stationCount: bigint | number;
  criticalStationsCount: bigint | number;
};

function localParts(value: Date): { weekday: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid',
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(value);
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    parts.find((part) => part.type === 'weekday')?.value ?? 'Sun',
  );
  return {
    weekday,
    hour: Number(parts.find((part) => part.type === 'hour')?.value ?? -1),
  };
}

export function selectComparableHourlyBaseline(
  rows: BaselineRow[],
  referenceAt: Date,
  currentStationCount: number,
): { baseline: NetworkBriefingBaseline; bucketStart: Date } | null {
  if (currentStationCount <= 0) return null;

  const target = localParts(referenceAt);
  const candidate = rows.find((row) => {
    const parts = localParts(new Date(row.bucketStart));
    return parts.weekday === target.weekday && parts.hour === target.hour &&
      Number(row.stationCount) >= Math.max(1, Math.floor(currentStationCount * 0.8));
  });
  if (!candidate) return null;

  return {
    baseline: {
      criticalStationsCount: Number(candidate.criticalStationsCount),
      activeAlertsCount: null,
      label: 'la misma franja de la semana anterior',
    },
    bucketStart: new Date(candidate.bucketStart),
  };
}

async function fetchHistoricalAlertCount(bucketStart: Date): Promise<number | null> {
  const searchStart = new Date(bucketStart.getTime() - 3 * 60 * 60 * 1000);
  const searchEnd = new Date(bucketStart.getTime() + 3 * 60 * 60 * 1000);

  try {
    const rows = await prisma.$queryRaw<Array<{ alertCount: bigint | number }>>`
      WITH alert_snapshots AS (
        SELECT "generatedAt", COUNT(DISTINCT ("stationId", "alertType")) AS "alertCount"
        FROM "StationAlert"
        WHERE "generatedAt" >= ${searchStart} AND "generatedAt" <= ${searchEnd}
        GROUP BY "generatedAt"
      )
      SELECT "alertCount"
      FROM alert_snapshots
      ORDER BY ABS(EXTRACT(EPOCH FROM ("generatedAt" - ${bucketStart}))) ASC
      LIMIT 1
    `;
    return rows.length > 0 ? Number(rows[0].alertCount) : null;
  } catch (error) {
    logger.warn('network_briefing.alert_baseline_failed', { error });
    return null;
  }
}

async function fetchHourlyRows(referenceAt: Date): Promise<BaselineRow[]> {
  return prisma.$queryRaw<BaselineRow[]>`
    SELECT "bucketStart",
           COUNT(*) AS "stationCount",
           COUNT(*) FILTER (WHERE "bikesMin" <= 0 OR "anchorsMin" <= 0) AS "criticalStationsCount"
    FROM "HourlyStationStat"
    WHERE "bucketStart" >= ${new Date(referenceAt.getTime() - 42 * 24 * 60 * 60 * 1000)}
      AND "bucketStart" < ${new Date(referenceAt.getTime() - 60 * 60 * 1000)}
    GROUP BY "bucketStart"
    ORDER BY "bucketStart" DESC
  `;
}

async function fetchSnapshotRows(referenceAt: Date): Promise<BaselineRow[]> {
  return prisma.$queryRaw<BaselineRow[]>`
    SELECT "recordedAt" AS "bucketStart",
           COUNT(*) AS "stationCount",
           COUNT(*) FILTER (WHERE "bikesAvailable" <= 0 OR "anchorsFree" <= 0) AS "criticalStationsCount"
    FROM "StationStatus"
    WHERE "recordedAt" >= ${new Date(referenceAt.getTime() - 42 * 24 * 60 * 60 * 1000)}
      AND "recordedAt" < ${new Date(referenceAt.getTime() - 60 * 60 * 1000)}
    GROUP BY "recordedAt"
    ORDER BY "recordedAt" DESC
  `;
}

/** Finds a same-weekday, same-local-hour historical reference. */
export async function fetchComparableNetworkBaseline(
  referenceAt: Date,
  currentStationCount: number,
): Promise<NetworkBriefingBaseline | null> {
  if (currentStationCount <= 0) return null;

  let selection: ReturnType<typeof selectComparableHourlyBaseline> = null;
  try {
    selection = selectComparableHourlyBaseline(
      await fetchHourlyRows(referenceAt),
      referenceAt,
      currentStationCount,
    );
  } catch (error) {
    logger.warn('network_briefing.hourly_baseline_failed', { error });
  }

  if (!selection) {
    try {
      selection = selectComparableHourlyBaseline(
        await fetchSnapshotRows(referenceAt),
        referenceAt,
        currentStationCount,
      );
    } catch (error) {
      logger.warn('network_briefing.snapshot_baseline_failed', { error });
    }
  }

  if (!selection) return null;

  return {
    ...selection.baseline,
    activeAlertsCount: await fetchHistoricalAlertCount(selection.bucketStart),
  };
}
