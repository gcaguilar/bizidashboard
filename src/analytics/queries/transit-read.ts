import { TransitProvider } from '@prisma/client';
import { prisma } from '@/lib/db';

export type TransitMode = 'bus' | 'tram';

function toProvider(mode: TransitMode): TransitProvider {
  return mode === 'tram' ? TransitProvider.TRAM : TransitProvider.BUS;
}

export async function getTransitStopsWithLatestSnapshot(mode: TransitMode): Promise<
  {
    id: string;
    externalId: string;
    name: string;
    lat: number;
    lon: number;
    provider: string;
    recordedAt: string | null;
    sourceUpdatedAt: string | null;
    etaMinutes: number | null;
    arrivalEvents: number;
    arrivalPressure: number;
    isStale: boolean;
  }[]
> {
  const provider = toProvider(mode);

  return prisma.$queryRaw`
    WITH latest AS (
      SELECT transitStopId, MAX(observedAt) AS observedAt
      FROM TransitSnapshot
      WHERE provider = ${provider}
      GROUP BY transitStopId
    )
    SELECT
      TransitStop.id,
      TransitStop.externalId,
      TransitStop.name,
      TransitStop.lat,
      TransitStop.lon,
      TransitStop.provider,
      TransitSnapshot.observedAt AS recordedAt,
      TransitSnapshot.sourceUpdatedAt,
      TransitSnapshot.etaMinutes,
      TransitSnapshot.arrivalEvents,
      TransitSnapshot.arrivalPressure,
      TransitSnapshot.isStale
    FROM TransitStop
    LEFT JOIN latest ON latest.transitStopId = TransitStop.id
    LEFT JOIN TransitSnapshot
      ON TransitSnapshot.transitStopId = latest.transitStopId
      AND TransitSnapshot.observedAt = latest.observedAt
      AND TransitSnapshot.provider = ${provider}
    WHERE TransitStop.provider = ${provider}
      AND TransitStop.isActive = true
    ORDER BY TransitStop.name ASC;
  `;
}

export async function getTransitAlerts(mode: TransitMode, limit = 50): Promise<
  {
    id: number;
    transitStopId: string;
    stopName: string;
    alertType: string;
    severity: number;
    metricValue: number;
    windowHours: number;
    generatedAt: string;
    isActive: boolean;
  }[]
> {
  const provider = toProvider(mode);

  return prisma.$queryRaw`
    SELECT
      TransitStopAlert.id,
      TransitStopAlert.transitStopId,
      TransitStop.name AS stopName,
      TransitStopAlert.alertType,
      TransitStopAlert.severity,
      TransitStopAlert.metricValue,
      TransitStopAlert.windowHours,
      TransitStopAlert.generatedAt,
      TransitStopAlert.isActive
    FROM TransitStopAlert
    INNER JOIN TransitStop ON TransitStop.id = TransitStopAlert.transitStopId
    WHERE TransitStopAlert.provider = ${provider}
      AND TransitStopAlert.isActive = true
    ORDER BY TransitStopAlert.generatedAt DESC
    LIMIT ${limit};
  `;
}

export async function getTransitRankings(mode: TransitMode, limit = 50): Promise<
  {
    id: number;
    transitStopId: string;
    stopName: string;
    criticalityScore: number;
    staleRate: number;
    avgEta: number | null;
    noRealtimeHours: number;
    totalHours: number;
    windowStart: string;
    windowEnd: string;
  }[]
> {
  const provider = toProvider(mode);

  return prisma.$queryRaw`
    SELECT
      TransitStopRanking.id,
      TransitStopRanking.transitStopId,
      TransitStop.name AS stopName,
      TransitStopRanking.criticalityScore,
      TransitStopRanking.staleRate,
      TransitStopRanking.avgEta,
      TransitStopRanking.noRealtimeHours,
      TransitStopRanking.totalHours,
      TransitStopRanking.windowStart,
      TransitStopRanking.windowEnd
    FROM TransitStopRanking
    INNER JOIN TransitStop ON TransitStop.id = TransitStopRanking.transitStopId
    WHERE TransitStopRanking.provider = ${provider}
      AND TransitStopRanking.windowEnd = (
        SELECT MAX(windowEnd)
        FROM TransitStopRanking
        WHERE provider = ${provider}
      )
    ORDER BY TransitStopRanking.criticalityScore DESC
    LIMIT ${limit};
  `;
}

export async function getTransitPatterns(mode: TransitMode, transitStopId: string): Promise<
  {
    transitStopId: string;
    dayType: string;
    hour: number;
    etaAvg: number | null;
    arrivalPressureAvg: number;
    arrivalEventsAvg: number;
    staleRate: number;
    sampleCount: number;
  }[]
> {
  const provider = toProvider(mode);

  return prisma.$queryRaw`
    SELECT transitStopId, dayType, hour, etaAvg, arrivalPressureAvg, arrivalEventsAvg, staleRate, sampleCount
    FROM TransitStopPattern
    WHERE transitStopId = ${transitStopId}
      AND provider = ${provider}
    ORDER BY dayType ASC, hour ASC;
  `;
}

export async function getTransitHeatmap(mode: TransitMode, transitStopId: string): Promise<
  {
    transitStopId: string;
    dayOfWeek: number;
    hour: number;
    etaAvg: number | null;
    arrivalPressureAvg: number;
    arrivalEventsAvg: number;
    staleRate: number;
    sampleCount: number;
  }[]
> {
  const provider = toProvider(mode);

  return prisma.$queryRaw`
    SELECT transitStopId, dayOfWeek, hour, etaAvg, arrivalPressureAvg, arrivalEventsAvg, staleRate, sampleCount
    FROM TransitStopHeatmapCell
    WHERE transitStopId = ${transitStopId}
      AND provider = ${provider}
    ORDER BY dayOfWeek ASC, hour ASC;
  `;
}

export async function getTransitStatus(mode: TransitMode): Promise<{
  activeStops: number;
  stopsWithRecentSnapshot: number;
  snapshotsLast24Hours: number;
  staleSnapshotsLast24Hours: number;
  lastSnapshotAt: string | null;
}> {
  const provider = toProvider(mode);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const [activeStops, recentStops, lastSnapshot, snapshotRows] = await Promise.all([
    prisma.transitStop.count({ where: { provider, isActive: true } }),
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(DISTINCT transitStopId) as count
      FROM TransitSnapshot
      WHERE provider = ${provider}
        AND observedAt >= ${fifteenMinutesAgo};
    `,
    prisma.transitSnapshot.findFirst({
      where: { provider },
      orderBy: { observedAt: 'desc' },
      select: { observedAt: true },
    }),
    prisma.$queryRaw<Array<{ total: number; stale: number }>>`
      SELECT COUNT(*) as total, SUM(CASE WHEN isStale THEN 1 ELSE 0 END) as stale
      FROM TransitSnapshot
      WHERE provider = ${provider}
        AND observedAt >= ${twentyFourHoursAgo};
    `,
  ]);

  return {
    activeStops,
    stopsWithRecentSnapshot: Number(recentStops[0]?.count ?? 0),
    snapshotsLast24Hours: Number(snapshotRows[0]?.total ?? 0),
    staleSnapshotsLast24Hours: Number(snapshotRows[0]?.stale ?? 0),
    lastSnapshotAt: lastSnapshot?.observedAt?.toISOString() ?? null,
  };
}
