import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { haversineDistanceMeters } from '@/lib/geo';
import type { NearbyStation, StationBaseMetrics, TimeBandMetrics } from '@/types/rebalancing';

export type CriticalEpisodeRow = {
  stationId: string;
  avgEmptyEpisodeMinutes: number;
  avgFullEpisodeMinutes: number;
  maxEmptyEpisodeMinutes: number;
  maxFullEpisodeMinutes: number;
  episodeCount: number;
};

function buildRangeFilter(column: string, days: number): Prisma.Sql {
  const safeDays = Math.max(1, Math.min(90, Math.floor(days)));
  return Prisma.sql`${Prisma.raw(`"${column}"`)} >= NOW() - INTERVAL '1 day' * ${safeDays}`;
}

export async function getStationGlobalMetrics(days: number = 15): Promise<Record<string, StationBaseMetrics>> {
  const filter = buildRangeFilter('bucketStart', days);

  const rows = await prisma.$queryRaw<
    Array<{
      stationId: string;
      occupancyAvg: number;
      pctTimeEmpty: number;
      pctTimeFull: number;
      rotation: number;
      rotationPerBike: number;
      persistenceProxy: number;
      variability: number;
      netImbalance: number;
    }>
  >`
    WITH with_lag AS (
      SELECT
        "stationId",
        "bucketStart",
        "bikesAvg" - LAG("bikesAvg") OVER (
          PARTITION BY "stationId"
          ORDER BY "bucketStart"
        ) AS delta
      FROM "HourlyStationStat"
      WHERE ${filter}
    ),
    imbalance AS (
      SELECT
        "stationId",
        SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END) - SUM(CASE WHEN delta < 0 THEN ABS(delta) ELSE 0 END) AS "netImbalance"
      FROM with_lag
      WHERE delta IS NOT NULL
      GROUP BY "stationId"
    )
    SELECT
      h."stationId",
      COALESCE(AVG(h."occupancyAvg"), 0) AS "occupancyAvg",
      COALESCE(COUNT(h."stationId") FILTER (WHERE h."bikesMin" <= 0)::float / NULLIF(COUNT(h."stationId"), 0), 0) AS "pctTimeEmpty",
      COALESCE(COUNT(h."stationId") FILTER (WHERE h."anchorsMin" <= 0)::float / NULLIF(COUNT(h."stationId"), 0), 0) AS "pctTimeFull",
      COALESCE(SUM((h."bikesMax" - h."bikesMin") + (h."anchorsMax" - h."anchorsMin")), 0) AS "rotation",
      COALESCE(SUM((h."bikesMax" - h."bikesMin") + (h."anchorsMax" - h."anchorsMin")) / NULLIF(AVG(h."bikesAvg"), 0), 0) AS "rotationPerBike",
      COALESCE(COUNT(h."stationId") FILTER (WHERE h."bikesMax" = h."bikesMin")::float / NULLIF(COUNT(h."stationId"), 0), 0) AS "persistenceProxy",
      COALESCE(STDDEV_POP(h."occupancyAvg"), 0) AS "variability",
      COALESCE(MAX(i."netImbalance"), 0) AS "netImbalance"
    FROM "HourlyStationStat" h
    LEFT JOIN imbalance i ON h."stationId" = i."stationId"
    WHERE ${filter}
    GROUP BY h."stationId"
  `;

  const map: Record<string, StationBaseMetrics> = {};
  for (const row of rows) {
    map[row.stationId] = {
      occupancyAvg: Number(row.occupancyAvg),
      pctTimeEmpty: Number(row.pctTimeEmpty),
      pctTimeFull: Number(row.pctTimeFull),
      rotation: Number(row.rotation),
      rotationPerBike: Number(row.rotationPerBike),
      persistenceProxy: Number(row.persistenceProxy),
      criticalEpisodeAvgMinutes: 0, // Will be filled later
      netImbalance: Number(row.netImbalance),
      variability: Number(row.variability),
      unsatisfiedDemandProxy: 0, // Computed from demand vs empty time
    };
  }

  return map;
}

export async function getStationTimeBandMetrics(days: number = 15): Promise<Record<string, TimeBandMetrics[]>> {
  const filter = buildRangeFilter('bucketStart', days);

  const rows = await prisma.$queryRaw<
    Array<{
      stationId: string;
      hourValue: number;
      dayOfWeek: number;
      occupancyAvg: number;
      pctTimeEmpty: number;
      pctTimeFull: number;
      rotation: number;
      rotationPerBike: number;
      persistenceProxy: number;
      variability: number;
    }>
  >`
    SELECT
      "stationId",
      EXTRACT(HOUR FROM "bucketStart")::int AS "hourValue",
      EXTRACT(DOW FROM "bucketStart")::int AS "dayOfWeek",
      COALESCE(AVG("occupancyAvg"), 0) AS "occupancyAvg",
      COALESCE(COUNT("stationId") FILTER (WHERE "bikesMin" <= 0)::float / NULLIF(COUNT("stationId"), 0), 0) AS "pctTimeEmpty",
      COALESCE(COUNT("stationId") FILTER (WHERE "anchorsMin" <= 0)::float / NULLIF(COUNT("stationId"), 0), 0) AS "pctTimeFull",
      COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0) AS "rotation",
      COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) / NULLIF(AVG("bikesAvg"), 0), 0) AS "rotationPerBike",
      COALESCE(COUNT("stationId") FILTER (WHERE "bikesMax" = "bikesMin")::float / NULLIF(COUNT("stationId"), 0), 0) AS "persistenceProxy",
      COALESCE(STDDEV_POP("occupancyAvg"), 0) AS "variability"
    FROM "HourlyStationStat"
    WHERE ${filter}
    GROUP BY "stationId", EXTRACT(HOUR FROM "bucketStart")::int, EXTRACT(DOW FROM "bucketStart")::int
  `;

  const map: Record<string, TimeBandMetrics[]> = {};

  const getBand = (hour: number) => {
    if (hour >= 7 && hour <= 9) return 'morning_peak';
    if (hour >= 10 && hour <= 16) return 'valley';
    if (hour >= 17 && hour <= 19) return 'evening_peak';
    return 'night';
  };

  const getDayCategory = (dow: number) => (dow === 0 || dow === 6 ? 'weekend' : 'weekday');

  for (const row of rows) {
    const timeBand = getBand(row.hourValue);
    const dayCategory = getDayCategory(row.dayOfWeek);

    if (!map[row.stationId]) {
      map[row.stationId] = [];
    }

    let bandMetric = map[row.stationId].find((b) => b.timeBand === timeBand && b.dayCategory === dayCategory);
    if (!bandMetric) {
      bandMetric = {
        timeBand,
        dayCategory,
        occupancyAvg: 0,
        pctTimeEmpty: 0,
        pctTimeFull: 0,
        rotation: 0,
        rotationPerBike: 0,
        persistenceProxy: 0,
        criticalEpisodeAvgMinutes: 0,
        netImbalance: 0,
        variability: 0,
        unsatisfiedDemandProxy: 0,
      };
      map[row.stationId].push(bandMetric);
    }

    // Accumulate for later averaging. This is an approximation since we group by hour + DOW first, 
    // but averaging across the band is sufficient.
    bandMetric.occupancyAvg += Number(row.occupancyAvg);
    bandMetric.pctTimeEmpty += Number(row.pctTimeEmpty);
    bandMetric.pctTimeFull += Number(row.pctTimeFull);
    bandMetric.rotation += Number(row.rotation);
    bandMetric.rotationPerBike += Number(row.rotationPerBike);
    bandMetric.persistenceProxy += Number(row.persistenceProxy);
    bandMetric.variability += Number(row.variability);
    bandMetric.unsatisfiedDemandProxy += Number(row.pctTimeEmpty) * Number(row.rotation); // proxy: empty % * demand
  }

  // Normalize by number of hours in band * days
  for (const stationId in map) {
    for (const bandMetric of map[stationId]) {
      const isNight = bandMetric.timeBand === 'night';
      const hoursInBand = isNight ? 10 : bandMetric.timeBand === 'valley' ? 7 : 3;
      const daysInCat = bandMetric.dayCategory === 'weekday' ? 5 : 2;
      const div = hoursInBand * daysInCat;

      bandMetric.occupancyAvg /= div;
      bandMetric.pctTimeEmpty /= div;
      bandMetric.pctTimeFull /= div;
      bandMetric.rotationPerBike /= div;
      bandMetric.persistenceProxy /= div;
      bandMetric.variability /= div;
    }
  }

  return map;
}

export async function getCriticalEpisodes(days: number = 15): Promise<Record<string, CriticalEpisodeRow>> {
  const filter = buildRangeFilter('recordedAt', days);

  const rows = await prisma.$queryRaw<
    Array<{
      stationId: string;
      avgEmptyMinutes: number;
      avgFullMinutes: number;
      maxEmptyMinutes: number;
      maxFullMinutes: number;
      episodeCount: number;
    }>
  >`
    WITH gaps AS (
      SELECT "stationId", "recordedAt", "bikesAvailable", "anchorsFree",
        CASE WHEN "bikesAvailable" <= 0 THEN 0 ELSE 1 END AS empty_flag,
        CASE WHEN "anchorsFree" <= 0 THEN 0 ELSE 1 END AS full_flag,
        ROW_NUMBER() OVER (PARTITION BY "stationId" ORDER BY "recordedAt")
        - ROW_NUMBER() OVER (PARTITION BY "stationId", CASE WHEN "bikesAvailable" <= 0 THEN 0 ELSE 1 END ORDER BY "recordedAt") AS empty_grp,
        ROW_NUMBER() OVER (PARTITION BY "stationId" ORDER BY "recordedAt")
        - ROW_NUMBER() OVER (PARTITION BY "stationId", CASE WHEN "anchorsFree" <= 0 THEN 0 ELSE 1 END ORDER BY "recordedAt") AS full_grp
      FROM "StationStatus"
      WHERE ${filter}
    ),
    empty_episodes AS (
      SELECT "stationId", MIN("recordedAt") AS start_time, MAX("recordedAt") AS end_time,
             EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt")))/60 AS duration_min
      FROM gaps
      WHERE empty_flag = 0
      GROUP BY "stationId", empty_grp
      HAVING EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt")))/60 > 0
    ),
    full_episodes AS (
      SELECT "stationId", MIN("recordedAt") AS start_time, MAX("recordedAt") AS end_time,
             EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt")))/60 AS duration_min
      FROM gaps
      WHERE full_flag = 0
      GROUP BY "stationId", full_grp
      HAVING EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt")))/60 > 0
    )
    SELECT
      s.id AS "stationId",
      COALESCE(AVG(e.duration_min), 0) AS "avgEmptyMinutes",
      COALESCE(MAX(e.duration_min), 0) AS "maxEmptyMinutes",
      COALESCE(AVG(f.duration_min), 0) AS "avgFullMinutes",
      COALESCE(MAX(f.duration_min), 0) AS "maxFullMinutes",
      COUNT(DISTINCT e.start_time) + COUNT(DISTINCT f.start_time) AS "episodeCount"
    FROM "Station" s
    LEFT JOIN empty_episodes e ON s.id = e."stationId"
    LEFT JOIN full_episodes f ON s.id = f."stationId"
    GROUP BY s.id
  `;

  const map: Record<string, CriticalEpisodeRow> = {};
  for (const row of rows) {
    map[row.stationId] = {
      stationId: row.stationId,
      avgEmptyEpisodeMinutes: Number(row.avgEmptyMinutes),
      avgFullEpisodeMinutes: Number(row.avgFullMinutes),
      maxEmptyEpisodeMinutes: Number(row.maxEmptyMinutes),
      maxFullEpisodeMinutes: Number(row.maxFullMinutes),
      episodeCount: Number(row.episodeCount),
    };
  }
  return map;
}

export async function getStationDistanceMatrix(
  stations: Array<{ id: string; lat: number; lon: number }>,
  maxDistanceMeters: number = 3000
): Promise<Map<string, NearbyStation[]>> {
  const matrix = new Map<string, NearbyStation[]>();

  for (const origin of stations) {
    const neighbors: NearbyStation[] = [];

    for (const destination of stations) {
      if (origin.id === destination.id) continue;

      const dist = haversineDistanceMeters(
        { latitude: origin.lat, longitude: origin.lon },
        { latitude: destination.lat, longitude: destination.lon }
      );

      if (dist <= maxDistanceMeters) {
        // walking time approx: 1.3 detour factor, 4.5 km/h (75 meters per minute)
        const walkingTimeMinutes = (dist * 1.3) / 75;
        
        neighbors.push({
          stationId: destination.id,
          distanceMeters: dist,
          walkingTimeMinutes,
          currentOccupancy: 0, // filled later
          historicalRobustness: 0, // filled later
        });
      }
    }
    
    // Sort by distance
    neighbors.sort((a, b) => a.distanceMeters - b.distanceMeters);
    matrix.set(origin.id, neighbors);
  }

  return matrix;
}
