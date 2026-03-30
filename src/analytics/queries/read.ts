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
    return Prisma.sql`${Prisma.raw(`"${column}"`)} >= ${start}::timestamp AND ${Prisma.raw(`"${column}"`)} < ${endExclusive}::timestamp`;
  }

  const safeDays = Math.max(1, Math.min(365, Math.floor(days)));
  return Prisma.sql`${Prisma.raw(`"${column}"`)} >= NOW() - INTERVAL '1 day' * ${safeDays}`;
}

function buildDemandSeriesQuery(days: number, monthKey?: string): Prisma.Sql {
  if (monthKey && isValidMonthKey(monthKey)) {
    const { start, endExclusive } = getMonthBounds(monthKey);
    return Prisma.sql`
      WITH date_series AS (
        SELECT TO_CHAR(day, 'YYYY-MM-DD') AS day
        FROM generate_series(${start}::timestamp, (${endExclusive}::timestamp - INTERVAL '1 day'), '1 day'::interval) AS day
      ),
      daily AS (
        SELECT
          TO_CHAR("bucketStart", 'YYYY-MM-DD') AS day,
          SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) AS "demandScore",
          AVG("occupancyAvg") AS "avgOccupancy",
          SUM("sampleCount") AS "sampleCount"
        FROM "HourlyStationStat"
        WHERE "bucketStart" >= ${start}::timestamp
          AND "bucketStart" < ${endExclusive}::timestamp
        GROUP BY 1
      )
      SELECT
        date_series.day AS day,
        COALESCE(daily."demandScore", 0) AS "demandScore",
        COALESCE(daily."avgOccupancy", 0) AS "avgOccupancy",
        COALESCE(daily."sampleCount", 0) AS "sampleCount"
      FROM date_series
      LEFT JOIN daily ON daily.day = date_series.day
      ORDER BY date_series.day ASC;
    `;
  }

  const safeDays = Math.max(1, Math.min(365, Math.floor(days)));
  const startOffsetDays = Math.max(0, safeDays - 1);

  return Prisma.sql`
    WITH date_series AS (
      SELECT TO_CHAR(day, 'YYYY-MM-DD') AS day
      FROM generate_series(
        (CURRENT_DATE - INTERVAL '1 day' * ${startOffsetDays})::timestamp,
        (CURRENT_DATE)::timestamp,
        '1 day'::interval
      ) AS day
    ),
    daily AS (
      SELECT
        TO_CHAR("bucketStart", 'YYYY-MM-DD') AS day,
        SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) AS "demandScore",
        AVG("occupancyAvg") AS "avgOccupancy",
        SUM("sampleCount") AS "sampleCount"
      FROM "HourlyStationStat"
      WHERE "bucketStart" >= CURRENT_DATE::timestamp - INTERVAL '1 day' * ${startOffsetDays}
      GROUP BY 1
    )
    SELECT
      date_series.day AS day,
      COALESCE(daily."demandScore", 0) AS "demandScore",
      COALESCE(daily."avgOccupancy", 0) AS "avgOccupancy",
      COALESCE(daily."sampleCount", 0) AS "sampleCount"
    FROM date_series
    LEFT JOIN daily ON daily.day = date_series.day
    ORDER BY date_series.day ASC;
  `;
}

async function getHourlyStatsForMonth(stationId: string, monthKey: string): Promise<HourlyStatRow[]> {
  const { start, endExclusive } = getMonthBounds(monthKey);

  return prisma.$queryRaw<HourlyStatRow[]>`
    SELECT "stationId", "bucketStart", "bikesAvg", "anchorsAvg", "occupancyAvg", "sampleCount"
    FROM "HourlyStationStat"
    WHERE "stationId" = ${stationId}
      AND "bucketStart" >= ${start}::timestamp
      AND "bucketStart" < ${endExclusive}::timestamp
    ORDER BY "bucketStart" ASC;
  `;
}

export async function getAvailableDataMonths(): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ monthKey: string | null }>>`
    SELECT DISTINCT TO_CHAR("bucketStart", 'YYYY-MM') AS "monthKey"
    FROM "HourlyStationStat"
    WHERE "bucketStart" IS NOT NULL
    ORDER BY "monthKey" DESC;
  `;

  return rows.map((row: { monthKey: string | null }) => row.monthKey).filter(isValidMonthKey);
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

type MonthlyDemandRow = {
  monthKey: string;
  demandScore: number;
  avgOccupancy: number;
  activeStations: number;
  sampleCount: number;
};

type SystemHourlyProfileRow = {
  hour: number;
  avgOccupancy: number;
  avgBikesAvailable: number;
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
      SELECT id, "stationId", "turnoverScore", "emptyHours", "fullHours", "totalHours", "windowStart", "windowEnd"
      FROM "StationRanking"
      WHERE "windowEnd" = (SELECT MAX("windowEnd") FROM "StationRanking")
      ORDER BY ("emptyHours" + "fullHours") DESC
      LIMIT ${limit};
    `;
  }

  return prisma.$queryRaw`
    SELECT id, "stationId", "turnoverScore", "emptyHours", "fullHours", "totalHours", "windowStart", "windowEnd"
    FROM "StationRanking"
    WHERE "windowEnd" = (SELECT MAX("windowEnd") FROM "StationRanking")
    ORDER BY "turnoverScore" DESC
    LIMIT ${limit};
  `;
}

/** Patrones agregados (laborable/fin de semana × hora) para varias estaciones en una sola consulta. */
export type StationPatternBulkRow = {
  stationId: string;
  dayType: string;
  hour: number;
  occupancyAvg: number;
  sampleCount: number;
};

export async function getStationPatternsBulk(stationIds: string[]): Promise<StationPatternBulkRow[]> {
  if (stationIds.length === 0) {
    return [];
  }
  const unique = [...new Set(stationIds)];
  const rows = await prisma.stationPattern.findMany({
    where: { stationId: { in: unique } },
    select: {
      stationId: true,
      dayType: true,
      hour: true,
      occupancyAvg: true,
      sampleCount: true,
    },
  });
  return rows.map((r) => ({
    stationId: r.stationId,
    dayType: String(r.dayType),
    hour: r.hour,
    occupancyAvg: r.occupancyAvg,
    sampleCount: r.sampleCount,
  }));
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
      SELECT "stationId", MAX("recordedAt") AS "recordedAt"
      FROM "StationStatus"
      GROUP BY "stationId"
    )
    SELECT "Station".id, "Station".name, "Station".lat, "Station".lon, "Station".capacity,
      "StationStatus"."bikesAvailable", "StationStatus"."anchorsFree", "StationStatus"."recordedAt"
    FROM "Station"
    INNER JOIN latest ON latest."stationId" = "Station".id
    INNER JOIN "StationStatus"
      ON "StationStatus"."stationId" = latest."stationId"
      AND "StationStatus"."recordedAt" = latest."recordedAt"
    WHERE "Station"."isActive" = true
    ORDER BY "Station".name ASC;
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
    SELECT "stationId", "dayType", hour, "bikesAvg", "anchorsAvg", "occupancyAvg", "sampleCount"
    FROM "StationPattern"
    WHERE "stationId" = ${stationId}
    ORDER BY "dayType" ASC, hour ASC;
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
    SELECT "stationId", "dayOfWeek", hour, "bikesAvg", "anchorsAvg", "occupancyAvg", "sampleCount"
    FROM "StationHeatmapCell"
    WHERE "stationId" = ${stationId}
    ORDER BY "dayOfWeek" ASC, hour ASC;
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
    SELECT id, "stationId", "alertType", severity, "metricValue", "windowHours", "generatedAt", "isActive"
    FROM "StationAlert"
    WHERE "isActive" = true
    ORDER BY "generatedAt" DESC
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
        "stationId",
        "bucketStart",
        "bikesAvg" - LAG("bikesAvg") OVER (
          PARTITION BY "stationId"
          ORDER BY "bucketStart"
        ) AS delta
      FROM "HourlyStationStat"
      WHERE ${rangeFilter}
    ),
    hourly AS (
      SELECT
        "stationId",
        EXTRACT(HOUR FROM "bucketStart")::int AS hour,
        SUM(CASE WHEN delta < 0 THEN ABS(delta) ELSE 0 END) AS departures,
        SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END) AS arrivals,
        COUNT(*) AS "sampleCount"
      FROM with_lag
      WHERE delta IS NOT NULL
      GROUP BY "stationId", EXTRACT(HOUR FROM "bucketStart")::int
    )
    SELECT "stationId", hour, departures, arrivals, "sampleCount"
    FROM hourly
    ORDER BY "stationId" ASC, hour ASC;
  `;
}

export async function getDailyDemandCurve(days = 30, monthKey?: string): Promise<DailyDemandRow[]> {
  const query = buildDemandSeriesQuery(days, monthKey)
  return prisma.$queryRaw<DailyDemandRow[]>(query)
}

export async function getMonthlyDemandCurve(limitMonths = 12): Promise<MonthlyDemandRow[]> {
  const safeLimit = Math.max(1, Math.min(36, Math.floor(limitMonths)));

  const rows = await prisma.$queryRaw<MonthlyDemandRow[]>`
    WITH monthly AS (
      SELECT
        TO_CHAR("bucketDate", 'YYYY-MM') AS "monthKey",
        COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0) AS "demandScore",
        COALESCE(AVG("occupancyAvg"), 0) AS "avgOccupancy",
        COUNT(DISTINCT "stationId") AS "activeStations",
        COALESCE(SUM("sampleCount"), 0) AS "sampleCount"
      FROM "DailyStationStat"
      WHERE "bucketDate" IS NOT NULL
      GROUP BY TO_CHAR("bucketDate", 'YYYY-MM')
      ORDER BY "monthKey" DESC
      LIMIT ${safeLimit}
    )
    SELECT "monthKey", "demandScore", "avgOccupancy", "activeStations", "sampleCount"
    FROM monthly
    ORDER BY "monthKey" ASC;
  `;

  return rows;
}

export async function getSystemHourlyProfile(
  days = 14,
  monthKey?: string
): Promise<SystemHourlyProfileRow[]> {
  const rangeFilter = buildRangeFilter('bucketStart', days, monthKey);

  return prisma.$queryRaw<SystemHourlyProfileRow[]>`
    SELECT
      EXTRACT(HOUR FROM "bucketStart")::int AS hour,
      AVG("occupancyAvg") AS "avgOccupancy",
      AVG("bikesAvg") AS "avgBikesAvailable",
      SUM("sampleCount") AS "sampleCount"
    FROM "HourlyStationStat"
    WHERE ${rangeFilter}
    GROUP BY EXTRACT(HOUR FROM "bucketStart")::int
    ORDER BY hour ASC;
  `;
}
