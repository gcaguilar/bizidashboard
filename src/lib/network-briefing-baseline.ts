import { prisma } from '@/lib/db';
import type { NetworkBriefingBaseline } from '@/lib/network-briefing';

type HourlyBaselineRow = {
  bucketStart: Date;
  stationCount: bigint | number;
  criticalStationsCount: bigint | number;
};

export function selectComparableHourlyBaseline(
  rows: HourlyBaselineRow[],
  referenceAt: Date,
  currentStationCount: number,
): NetworkBriefingBaseline | null {
  if (currentStationCount <= 0) return null;
  const target = localParts(referenceAt);
  const candidate = rows.find((row) => {
    const parts = localParts(new Date(row.bucketStart));
    return parts.weekday === target.weekday && parts.hour === target.hour &&
      Number(row.stationCount) >= Math.max(1, Math.floor(currentStationCount * 0.8));
  });
  if (!candidate) return null;
  return {
    criticalStationsCount: Number(candidate.criticalStationsCount),
    activeAlertsCount: null,
    label: 'la misma franja de la semana anterior',
  };
}

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

/** Finds a recent same-weekday/same-hour sample without changing any public API. */
export async function fetchComparableNetworkBaseline(
  referenceAt: Date,
  currentStationCount: number,
): Promise<NetworkBriefingBaseline | null> {
  if (currentStationCount <= 0) return null;

  try {
    const rows = await prisma.$queryRaw<HourlyBaselineRow[]>`
      SELECT "bucketStart",
             COUNT(*) AS "stationCount",
             COUNT(*) FILTER (WHERE "bikesMin" <= 0 OR "anchorsMin" <= 0) AS "criticalStationsCount"
      FROM "HourlyStationStat"
      WHERE "bucketStart" >= ${new Date(referenceAt.getTime() - 42 * 24 * 60 * 60 * 1000)}
        AND "bucketStart" < ${new Date(referenceAt.getTime() - 60 * 60 * 1000)}
      GROUP BY "bucketStart"
      ORDER BY "bucketStart" DESC
    `;
    return selectComparableHourlyBaseline(rows, referenceAt, currentStationCount);
  } catch {
    return null;
  }
}
