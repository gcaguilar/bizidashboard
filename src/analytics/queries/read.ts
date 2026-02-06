import { prisma } from '@/lib/db';
import { AlertType } from '@/analytics/types';

export type RankingType = 'turnover' | 'availability';

async function getLatestRankingWindowEnd(): Promise<Date | null> {
  const [{ windowEnd = null } = {}] = await prisma.$queryRaw<
    { windowEnd: string | null }[]
  >`SELECT MAX(windowEnd) as windowEnd FROM StationRanking;`;

  if (!windowEnd) {
    return null;
  }

  return new Date(windowEnd.replace(' ', 'T') + 'Z');
}

export async function getStationRankings(
  type: RankingType,
  limit = 20
): Promise<
  {
    id: number;
    stationId: string;
    turnoverScore: number;
    emptyHours: number;
    fullHours: number;
    totalHours: number;
    windowStart: string;
    windowEnd: string;
  }[]
> {
  const windowEnd = await getLatestRankingWindowEnd();

  if (!windowEnd) {
    return [];
  }

  if (type === 'availability') {
    return prisma.$queryRaw`
      SELECT id, stationId, turnoverScore, emptyHours, fullHours, totalHours, windowStart, windowEnd
      FROM StationRanking
      WHERE windowEnd = ${windowEnd}
      ORDER BY (emptyHours + fullHours) DESC
      LIMIT ${limit};
    `;
  }

  return prisma.$queryRaw`
    SELECT id, stationId, turnoverScore, emptyHours, fullHours, totalHours, windowStart, windowEnd
    FROM StationRanking
    WHERE windowEnd = ${windowEnd}
    ORDER BY turnoverScore DESC
    LIMIT ${limit};
  `;
}

export async function getStationsWithLatestStatus(): Promise<
  {
    id: string;
    name: string;
    lat: number;
    lon: number;
    capacity: number;
    bikesAvailable: number;
    anchorsFree: number;
    recordedAt: string;
  }[]
> {
  return prisma.$queryRaw`
    WITH latest AS (
      SELECT stationId, MAX(recordedAt) AS recordedAt
      FROM StationStatus
      GROUP BY stationId
    )
    SELECT Station.id, Station.name, Station.lat, Station.lon, Station.capacity,
      StationStatus.bikesAvailable, StationStatus.anchorsFree, StationStatus.recordedAt
    FROM Station
    INNER JOIN latest ON latest.stationId = Station.id
    INNER JOIN StationStatus
      ON StationStatus.stationId = latest.stationId
      AND StationStatus.recordedAt = latest.recordedAt
    WHERE Station.isActive = true
    ORDER BY Station.name ASC;
  `;
}

export async function getStationPatterns(stationId: string): Promise<
  {
    stationId: string;
    dayType: string;
    hour: number;
    bikesAvg: number;
    anchorsAvg: number;
    occupancyAvg: number;
    sampleCount: number;
  }[]
> {
  return prisma.$queryRaw`
    SELECT stationId, dayType, hour, bikesAvg, anchorsAvg, occupancyAvg, sampleCount
    FROM StationPattern
    WHERE stationId = ${stationId}
    ORDER BY dayType ASC, hour ASC;
  `;
}

export async function getHeatmap(stationId: string): Promise<
  {
    stationId: string;
    dayOfWeek: number;
    hour: number;
    bikesAvg: number;
    anchorsAvg: number;
    occupancyAvg: number;
    sampleCount: number;
  }[]
> {
  return prisma.$queryRaw`
    SELECT stationId, dayOfWeek, hour, bikesAvg, anchorsAvg, occupancyAvg, sampleCount
    FROM StationHeatmapCell
    WHERE stationId = ${stationId}
    ORDER BY dayOfWeek ASC, hour ASC;
  `;
}

export async function getActiveAlerts(limit = 50): Promise<
  {
    id: number;
    stationId: string;
    alertType: AlertType;
    severity: number;
    metricValue: number;
    windowHours: number;
    generatedAt: string;
    isActive: boolean;
  }[]
> {
  return prisma.$queryRaw`
    SELECT id, stationId, alertType, severity, metricValue, windowHours, generatedAt, isActive
    FROM StationAlert
    WHERE isActive = true
    ORDER BY generatedAt DESC
    LIMIT ${limit};
  `;
}
