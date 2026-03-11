import { Prisma } from '@prisma/client';
import { AlertType } from '@/analytics/types';
import { getLocalBucket } from '@/analytics/time-buckets';
import { prisma } from '@/lib/db';
import { getMonthBounds, isValidMonthKey } from '@/lib/months';

export type RankingType = 'turnover' | 'availability';

type StationPatternRow = {
  stationId: string;
  dayType: string;
  hour: number;
  bikesAvg: number;
  anchorsAvg: number;
  occupancyAvg: number;
  sampleCount: number;
};

type HeatmapRow = {
  stationId: string;
  dayOfWeek: number;
  hour: number;
  bikesAvg: number;
  anchorsAvg: number;
  occupancyAvg: number;
  sampleCount: number;
};

type HourlyStatRow = {
  stationId: string;
  bucketStart: string | Date;
  bikesAvg: number;
  anchorsAvg: number;
  occupancyAvg: number;
  sampleCount: number;
};

function parseBucketStart(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  if (value.includes('T')) {
    return new Date(value);
  }

  return new Date(value.replace(' ', 'T') + 'Z');
}

function buildRangeFilter(column: string, days: number, monthKey?: string): Prisma.Sql {
  if (monthKey && isValidMonthKey(monthKey)) {
    const { start, endExclusive } = getMonthBounds(monthKey);
    return Prisma.sql`datetime(${Prisma.raw(column)}) >= datetime(${start}) AND datetime(${Prisma.raw(
      column
    )}) < datetime(${endExclusive})`;
  }

  const safeDays = Math.max(1, Math.min(365, Math.floor(days)));
  const daysModifier = `-${safeDays} days`;
  return Prisma.sql`datetime(${Prisma.raw(column)}) >= datetime('now', ${daysModifier})`;
}

function buildDemandSeriesQuery(days: number, monthKey?: string): Prisma.Sql {
  if (monthKey && isValidMonthKey(monthKey)) {
    const { start, endExclusive } = getMonthBounds(monthKey);
    return Prisma.sql`
      WITH RECURSIVE date_series(day) AS (
        SELECT date(${start})
        UNION ALL
        SELECT date(day, '+1 day')
        FROM date_series
        WHERE day < date(${endExclusive}, '-1 day')
      ),
      daily AS (
        SELECT
          date(bucketStart) AS day,
          SUM((bikesMax - bikesMin) + (anchorsMax - anchorsMin)) AS demandScore,
          AVG(occupancyAvg) AS avgOccupancy,
          SUM(sampleCount) AS sampleCount
        FROM HourlyStationStat
        WHERE datetime(bucketStart) >= datetime(${start})
          AND datetime(bucketStart) < datetime(${endExclusive})
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

  const safeDays = Math.max(1, Math.min(365, Math.floor(days)));
  const startOffsetDays = Math.max(0, safeDays - 1);
  const daysModifier = `-${startOffsetDays} days`;

  return Prisma.sql`
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

async function getHourlyStatsForMonth(stationId: string, monthKey: string): Promise<HourlyStatRow[]> {
  const { start, endExclusive } = getMonthBounds(monthKey);

  return prisma.$queryRaw<HourlyStatRow[]>`
    SELECT stationId, bucketStart, bikesAvg, anchorsAvg, occupancyAvg, sampleCount
    FROM HourlyStationStat
    WHERE stationId = ${stationId}
      AND datetime(bucketStart) >= datetime(${start})
      AND datetime(bucketStart) < datetime(${endExclusive})
    ORDER BY datetime(bucketStart) ASC;
  `;
}

export async function getAvailableDataMonths(): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ monthKey: string | null }>>`
    SELECT DISTINCT strftime('%Y-%m', bucketStart) AS monthKey
    FROM HourlyStationStat
    WHERE bucketStart IS NOT NULL
    ORDER BY monthKey DESC;
  `;

  return rows.map((row) => row.monthKey).filter(isValidMonthKey);
}

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

type HourlyTransitImpactRow = {
  provider: string;
  hour: number;
  avgDeparturesWithTransit: number;
  avgDeparturesWithoutTransit: number;
  uplift: number;
  upliftRatio: number | null;
  avgArrivalPressure: number;
  totalArrivalEvents: number;
  samplesWithTransit: number;
  samplesWithoutTransit: number;
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

export async function getStationPatterns(stationId: string, monthKey?: string): Promise<StationPatternRow[]> {
  if (monthKey && isValidMonthKey(monthKey)) {
    const hourlyStats = await getHourlyStatsForMonth(stationId, monthKey);
    const aggregates = new Map<string, StationPatternRow>();

    for (const stat of hourlyStats) {
      const { hour, dayType } = getLocalBucket(parseBucketStart(stat.bucketStart));
      const key = `${dayType}-${hour}`;
      const sampleCount = Number(stat.sampleCount) || 0;
      const current = aggregates.get(key);

      if (current) {
        current.bikesAvg += Number(stat.bikesAvg) * sampleCount;
        current.anchorsAvg += Number(stat.anchorsAvg) * sampleCount;
        current.occupancyAvg += Number(stat.occupancyAvg) * sampleCount;
        current.sampleCount += sampleCount;
      } else {
        aggregates.set(key, {
          stationId,
          dayType,
          hour,
          bikesAvg: Number(stat.bikesAvg) * sampleCount,
          anchorsAvg: Number(stat.anchorsAvg) * sampleCount,
          occupancyAvg: Number(stat.occupancyAvg) * sampleCount,
          sampleCount,
        });
      }
    }

    return Array.from(aggregates.values())
      .map((row) => {
        const divisor = row.sampleCount || 1;
        return {
          ...row,
          bikesAvg: row.bikesAvg / divisor,
          anchorsAvg: row.anchorsAvg / divisor,
          occupancyAvg: row.occupancyAvg / divisor,
        };
      })
      .sort((left, right) => left.dayType.localeCompare(right.dayType) || left.hour - right.hour);
  }

  return prisma.$queryRaw`
    SELECT stationId, dayType, hour, bikesAvg, anchorsAvg, occupancyAvg, sampleCount
    FROM StationPattern
    WHERE stationId = ${stationId}
    ORDER BY dayType ASC, hour ASC;
  `;
}

export async function getHeatmap(stationId: string, monthKey?: string): Promise<HeatmapRow[]> {
  if (monthKey && isValidMonthKey(monthKey)) {
    const hourlyStats = await getHourlyStatsForMonth(stationId, monthKey);
    const aggregates = new Map<string, HeatmapRow>();

    for (const stat of hourlyStats) {
      const { hour, dayOfWeek } = getLocalBucket(parseBucketStart(stat.bucketStart));
      const key = `${dayOfWeek}-${hour}`;
      const sampleCount = Number(stat.sampleCount) || 0;
      const current = aggregates.get(key);

      if (current) {
        current.bikesAvg += Number(stat.bikesAvg) * sampleCount;
        current.anchorsAvg += Number(stat.anchorsAvg) * sampleCount;
        current.occupancyAvg += Number(stat.occupancyAvg) * sampleCount;
        current.sampleCount += sampleCount;
      } else {
        aggregates.set(key, {
          stationId,
          dayOfWeek,
          hour,
          bikesAvg: Number(stat.bikesAvg) * sampleCount,
          anchorsAvg: Number(stat.anchorsAvg) * sampleCount,
          occupancyAvg: Number(stat.occupancyAvg) * sampleCount,
          sampleCount,
        });
      }
    }

    return Array.from(aggregates.values())
      .map((row) => {
        const divisor = row.sampleCount || 1;
        return {
          ...row,
          bikesAvg: row.bikesAvg / divisor,
          anchorsAvg: row.anchorsAvg / divisor,
          occupancyAvg: row.occupancyAvg / divisor,
        };
      })
      .sort((left, right) => left.dayOfWeek - right.dayOfWeek || left.hour - right.hour);
  }

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
  days = 14,
  monthKey?: string
): Promise<HourlyMobilitySignalRow[]> {
  const rangeFilter = buildRangeFilter('bucketStart', days, monthKey);

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
      WHERE ${rangeFilter}
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

export async function getDailyDemandCurve(days = 30, monthKey?: string): Promise<DailyDemandRow[]> {
  return prisma.$queryRaw<DailyDemandRow[]>(buildDemandSeriesQuery(days, monthKey));
}

export async function getHourlyTransitImpact(
  days = 14,
  monthKey?: string
): Promise<HourlyTransitImpactRow[]> {
  const rangeFilter = buildRangeFilter('bucketStart', days, monthKey);

  return prisma.$queryRaw<HourlyTransitImpactRow[]>`
    WITH base AS (
      SELECT
        stationId,
        provider,
        bucketStart,
        departures,
        arrivalPressureAvg,
        arrivalEvents,
        hasArrivalEvent
      FROM HourlyTransitImpact
      WHERE ${rangeFilter}
    ),
    provider_hour AS (
      SELECT
        provider AS provider,
        CAST(strftime('%H', bucketStart) AS INTEGER) AS hour,
        AVG(CASE WHEN hasArrivalEvent THEN departures ELSE NULL END) AS avgDeparturesWithTransit,
        AVG(CASE WHEN NOT hasArrivalEvent THEN departures ELSE NULL END) AS avgDeparturesWithoutTransit,
        AVG(arrivalPressureAvg) AS avgArrivalPressure,
        SUM(arrivalEvents) AS totalArrivalEvents,
        SUM(CASE WHEN hasArrivalEvent THEN 1 ELSE 0 END) AS samplesWithTransit,
        SUM(CASE WHEN NOT hasArrivalEvent THEN 1 ELSE 0 END) AS samplesWithoutTransit
      FROM base
      GROUP BY
        provider,
        CAST(strftime('%H', bucketStart) AS INTEGER)
    ),
    combined_base AS (
      SELECT
        stationId,
        bucketStart,
        AVG(departures) AS departures,
        SUM(arrivalPressureAvg) AS arrivalPressure,
        SUM(arrivalEvents) AS arrivalEvents,
        MAX(CASE WHEN hasArrivalEvent THEN 1 ELSE 0 END) AS hasArrivalEvent
      FROM base
      GROUP BY stationId, bucketStart
    ),
    combined_hour AS (
      SELECT
        'COMBINED' AS provider,
        CAST(strftime('%H', bucketStart) AS INTEGER) AS hour,
        AVG(CASE WHEN hasArrivalEvent > 0 THEN departures ELSE NULL END) AS avgDeparturesWithTransit,
        AVG(CASE WHEN hasArrivalEvent <= 0 THEN departures ELSE NULL END) AS avgDeparturesWithoutTransit,
        AVG(arrivalPressure) AS avgArrivalPressure,
        SUM(arrivalEvents) AS totalArrivalEvents,
        SUM(CASE WHEN hasArrivalEvent > 0 THEN 1 ELSE 0 END) AS samplesWithTransit,
        SUM(CASE WHEN hasArrivalEvent <= 0 THEN 1 ELSE 0 END) AS samplesWithoutTransit
      FROM combined_base
      GROUP BY CAST(strftime('%H', bucketStart) AS INTEGER)
    ),
    unioned AS (
      SELECT
        provider,
        hour,
        avgDeparturesWithTransit,
        avgDeparturesWithoutTransit,
        avgArrivalPressure,
        totalArrivalEvents,
        samplesWithTransit,
        samplesWithoutTransit
      FROM provider_hour
      UNION ALL
      SELECT
        provider,
        hour,
        avgDeparturesWithTransit,
        avgDeparturesWithoutTransit,
        avgArrivalPressure,
        totalArrivalEvents,
        samplesWithTransit,
        samplesWithoutTransit
      FROM combined_hour
    )
    SELECT
      provider,
      hour,
      COALESCE(avgDeparturesWithTransit, 0) AS avgDeparturesWithTransit,
      COALESCE(avgDeparturesWithoutTransit, 0) AS avgDeparturesWithoutTransit,
      COALESCE(avgDeparturesWithTransit, 0) - COALESCE(avgDeparturesWithoutTransit, 0) AS uplift,
      CASE
        WHEN avgDeparturesWithoutTransit IS NULL OR avgDeparturesWithoutTransit <= 0 THEN NULL
        ELSE (COALESCE(avgDeparturesWithTransit, 0) - avgDeparturesWithoutTransit) / avgDeparturesWithoutTransit
      END AS upliftRatio,
      COALESCE(avgArrivalPressure, 0) AS avgArrivalPressure,
      COALESCE(totalArrivalEvents, 0) AS totalArrivalEvents,
      COALESCE(samplesWithTransit, 0) AS samplesWithTransit,
      COALESCE(samplesWithoutTransit, 0) AS samplesWithoutTransit
    FROM unioned
    ORDER BY provider ASC, hour ASC;
  `;
}
