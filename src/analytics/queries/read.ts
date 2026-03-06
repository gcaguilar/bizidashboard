import { prisma } from '@/lib/db';
import { AlertType } from '@/analytics/types';

export type RankingType = 'turnover' | 'availability';

type HourlyMobilitySignalRow = {
  stationId: string;
  hour: number;
  departures: number;
  arrivals: number;
  sampleCount: number;
};

type DailyDemandRow = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  sampleCount: number;
};

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
  if (type === 'availability') {
    return prisma.$queryRaw`
      SELECT id, stationId, turnoverScore, emptyHours, fullHours, totalHours, windowStart, windowEnd
      FROM StationRanking
      WHERE windowEnd = (SELECT MAX(windowEnd) FROM StationRanking)
      ORDER BY (emptyHours + fullHours) DESC
      LIMIT ${limit};
    `;
  }

  return prisma.$queryRaw`
    SELECT id, stationId, turnoverScore, emptyHours, fullHours, totalHours, windowStart, windowEnd
    FROM StationRanking
    WHERE windowEnd = (SELECT MAX(windowEnd) FROM StationRanking)
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

export async function getHourlyMobilitySignals(
  days = 14
): Promise<HourlyMobilitySignalRow[]> {
  const safeDays = Math.max(1, Math.min(365, Math.floor(days)));
  const daysModifier = `-${safeDays} days`;

  return prisma.$queryRaw<HourlyMobilitySignalRow[]>`
    WITH with_lag AS (
      SELECT
        stationId,
        bucketStart,
        bikesAvg - LAG(bikesAvg) OVER (
          PARTITION BY stationId
          ORDER BY datetime(bucketStart)
        ) AS delta
      FROM HourlyStationStat
      WHERE datetime(bucketStart) >= datetime('now', ${daysModifier})
    ),
    hourly AS (
      SELECT
        stationId,
        CAST(strftime('%H', bucketStart) AS INTEGER) AS hour,
        SUM(CASE WHEN delta < 0 THEN ABS(delta) ELSE 0 END) AS departures,
        SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END) AS arrivals,
        COUNT(*) AS sampleCount
      FROM with_lag
      WHERE delta IS NOT NULL
      GROUP BY stationId, CAST(strftime('%H', bucketStart) AS INTEGER)
    )
    SELECT stationId, hour, departures, arrivals, sampleCount
    FROM hourly
    ORDER BY stationId ASC, hour ASC;
  `;
}

export async function getDailyDemandCurve(days = 30): Promise<DailyDemandRow[]> {
  const safeDays = Math.max(1, Math.min(365, Math.floor(days)));
  const startOffsetDays = Math.max(0, safeDays - 1);
  const daysModifier = `-${startOffsetDays} days`;

  return prisma.$queryRaw<DailyDemandRow[]>`
    WITH RECURSIVE date_series(day) AS (
      SELECT date('now', ${daysModifier})
      UNION ALL
      SELECT date(day, '+1 day')
      FROM date_series
      WHERE day < date('now')
    ),
    daily AS (
      SELECT
        date(bucketStart) AS day,
        SUM((bikesMax - bikesMin) + (anchorsMax - anchorsMin)) AS demandScore,
        AVG(occupancyAvg) AS avgOccupancy,
        SUM(sampleCount) AS sampleCount
      FROM HourlyStationStat
      WHERE datetime(bucketStart) >= datetime('now', ${daysModifier})
      GROUP BY date(bucketStart)
    )
    SELECT
      date_series.day AS day,
      COALESCE(daily.demandScore, 0) AS demandScore,
      COALESCE(daily.avgOccupancy, 0) AS avgOccupancy,
      COALESCE(daily.sampleCount, 0) AS sampleCount
    FROM date_series
    LEFT JOIN daily ON daily.day = date_series.day
    ORDER BY date_series.day ASC;
  `;
}
