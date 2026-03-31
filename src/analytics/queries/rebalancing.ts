import { prisma } from '@/lib/db';
import { haversineDistanceMeters } from '@/lib/geo';
import type { NearbyStation, StationBaseMetrics, TimeBandMetrics, TimeBand, DayCategory } from '@/types/rebalancing';

// ─── Raw DB row types ────────────────────────────────────────────────────────

type RawGlobalMetricsRow = {
  stationId: string;
  occupancyAvg: number;
  pctTimeEmpty: number;
  pctTimeFull: number;
  rotation: number;
  rotationPerBike: number | null;
  persistenceProxy: number;
  variability: number;
  netImbalance: number;
  sampleCount: number;
};

type RawTimeBandMetricsRow = {
  stationId: string;
  timeBand: string;
  dayCategory: string;
  occupancyAvg: number;
  pctTimeEmpty: number;
  pctTimeFull: number;
  rotation: number;
  rotationPerBike: number | null;
  persistenceProxy: number;
  variability: number;
  netImbalance: number;
  sampleCount: number;
};

type RawCriticalEpisodesRow = {
  stationId: string;
  avgEmptyEpisodeMinutes: number | null;
  avgFullEpisodeMinutes: number | null;
  maxEmptyEpisodeMinutes: number | null;
  maxFullEpisodeMinutes: number | null;
  episodeCount: number;
};

type RawStationPoint = {
  id: string;
  lat: number;
  lon: number;
  capacity: number;
};

// ─── Hour → TimeBand mapping ─────────────────────────────────────────────────

/**
 * Maps a local hour (0–23) to a TimeBand label.
 * morning_peak: 7–9 | valley: 10–16 | evening_peak: 17–19 | night: 20–6
 */
export function hourToTimeBand(hour: number): TimeBand {
  if (hour >= 7 && hour <= 9) return 'morning_peak';
  if (hour >= 10 && hour <= 16) return 'valley';
  if (hour >= 17 && hour <= 19) return 'evening_peak';
  return 'night';
}

// ─── Global metrics query ────────────────────────────────────────────────────

/**
 * Returns aggregate metrics for all active stations over the given window.
 * Includes rotation, occupancy, persistence, variability, and net imbalance.
 */
export async function getStationGlobalMetrics(
  days: number
): Promise<Map<string, StationBaseMetrics & { sampleCount: number }>> {
  const safeDays = Math.max(1, Math.min(90, Math.floor(days)));

  const rows = await prisma.$queryRaw<RawGlobalMetricsRow[]>`
    WITH deltas AS (
      SELECT
        "stationId",
        "bucketStart",
        "bikesAvg",
        "anchorsAvg",
        "occupancyAvg",
        "bikesMin",
        "bikesMax",
        "anchorsMin",
        "anchorsMax",
        "sampleCount",
        LAG("bikesAvg") OVER (PARTITION BY "stationId" ORDER BY "bucketStart") AS prev_bikes
      FROM "HourlyStationStat"
      WHERE "bucketStart" >= NOW() - INTERVAL '1 day' * ${safeDays}
    ),
    aggregated AS (
      SELECT
        "stationId",
        AVG("occupancyAvg")::float                                                      AS "occupancyAvg",
        (COUNT(*) FILTER (WHERE "bikesMin" = 0))::float / NULLIF(COUNT(*), 0)           AS "pctTimeEmpty",
        (COUNT(*) FILTER (WHERE "anchorsMin" = 0))::float / NULLIF(COUNT(*), 0)         AS "pctTimeFull",
        SUM("bikesMax" - "bikesMin" + "anchorsMax" - "anchorsMin")::float               AS "rotation",
        SUM("bikesMax" - "bikesMin" + "anchorsMax" - "anchorsMin")::float
          / NULLIF(AVG("bikesAvg"), 0)                                                  AS "rotationPerBike",
        (COUNT(*) FILTER (WHERE "bikesMax" = "bikesMin"))::float / NULLIF(COUNT(*), 0)  AS "persistenceProxy",
        COALESCE(STDDEV_POP("occupancyAvg"), 0)::float                                  AS "variability",
        COALESCE(SUM(
          CASE
            WHEN prev_bikes IS NOT NULL AND "bikesAvg" > prev_bikes
              THEN "bikesAvg" - prev_bikes
            WHEN prev_bikes IS NOT NULL AND "bikesAvg" < prev_bikes
              THEN -("bikesAvg" - prev_bikes)
            ELSE 0
          END
        ), 0)::float                                                                    AS "netImbalance",
        COUNT(*)::int                                                                    AS "sampleCount"
      FROM deltas
      GROUP BY "stationId"
    )
    SELECT * FROM aggregated;
  `;

  const map = new Map<string, StationBaseMetrics & { sampleCount: number }>();
  for (const row of rows) {
    map.set(row.stationId, {
      occupancyAvg: Number(row.occupancyAvg) || 0,
      pctTimeEmpty: Number(row.pctTimeEmpty) || 0,
      pctTimeFull: Number(row.pctTimeFull) || 0,
      rotation: Number(row.rotation) || 0,
      rotationPerBike: Number(row.rotationPerBike) || 0,
      persistenceProxy: Number(row.persistenceProxy) || 0,
      criticalEpisodeAvgMinutes: 0, // filled in from getCriticalEpisodes
      netImbalance: Number(row.netImbalance) || 0,
      variability: Number(row.variability) || 0,
      unsatisfiedDemandProxy: 0, // computed after joining with demand data
      sampleCount: Number(row.sampleCount) || 0,
    });
  }
  return map;
}

// ─── Time-band segmented metrics query ──────────────────────────────────────

/**
 * Returns metrics segmented by time band (morning_peak / valley / evening_peak / night)
 * and day category (weekday / weekend) for each station.
 */
export async function getStationTimeBandMetrics(
  days: number
): Promise<Map<string, TimeBandMetrics[]>> {
  const safeDays = Math.max(1, Math.min(90, Math.floor(days)));

  const rows = await prisma.$queryRaw<RawTimeBandMetricsRow[]>`
    WITH categorised AS (
      SELECT
        "stationId",
        "bucketStart",
        "bikesMin",
        "bikesMax",
        "anchorsMin",
        "anchorsMax",
        "bikesAvg",
        "occupancyAvg",
        "sampleCount",
        CASE
          WHEN EXTRACT(HOUR FROM "bucketStart") BETWEEN 7 AND 9   THEN 'morning_peak'
          WHEN EXTRACT(HOUR FROM "bucketStart") BETWEEN 10 AND 16 THEN 'valley'
          WHEN EXTRACT(HOUR FROM "bucketStart") BETWEEN 17 AND 19 THEN 'evening_peak'
          ELSE 'night'
        END AS "timeBand",
        CASE
          WHEN EXTRACT(DOW FROM "bucketStart") IN (0, 6) THEN 'weekend'
          ELSE 'weekday'
        END AS "dayCategory",
        LAG("bikesAvg") OVER (PARTITION BY "stationId" ORDER BY "bucketStart") AS prev_bikes
      FROM "HourlyStationStat"
      WHERE "bucketStart" >= NOW() - INTERVAL '1 day' * ${safeDays}
    )
    SELECT
      "stationId",
      "timeBand",
      "dayCategory",
      AVG("occupancyAvg")::float                                                      AS "occupancyAvg",
      (COUNT(*) FILTER (WHERE "bikesMin" = 0))::float / NULLIF(COUNT(*), 0)           AS "pctTimeEmpty",
      (COUNT(*) FILTER (WHERE "anchorsMin" = 0))::float / NULLIF(COUNT(*), 0)         AS "pctTimeFull",
      SUM("bikesMax" - "bikesMin" + "anchorsMax" - "anchorsMin")::float               AS "rotation",
      SUM("bikesMax" - "bikesMin" + "anchorsMax" - "anchorsMin")::float
        / NULLIF(AVG("bikesAvg"), 0)                                                  AS "rotationPerBike",
      (COUNT(*) FILTER (WHERE "bikesMax" = "bikesMin"))::float / NULLIF(COUNT(*), 0)  AS "persistenceProxy",
      COALESCE(STDDEV_POP("occupancyAvg"), 0)::float                                  AS "variability",
      COALESCE(SUM(
        CASE
          WHEN prev_bikes IS NOT NULL AND "bikesAvg" > prev_bikes
            THEN "bikesAvg" - prev_bikes
          WHEN prev_bikes IS NOT NULL AND "bikesAvg" < prev_bikes
            THEN -("bikesAvg" - prev_bikes)
          ELSE 0
        END
      ), 0)::float                                                                    AS "netImbalance",
      COUNT(*)::int                                                                    AS "sampleCount"
    FROM categorised
    GROUP BY "stationId", "timeBand", "dayCategory";
  `;

  const map = new Map<string, TimeBandMetrics[]>();
  for (const row of rows) {
    const band = row.timeBand as TimeBand;
    const cat = row.dayCategory as DayCategory;
    const metrics: TimeBandMetrics = {
      timeBand: band,
      dayCategory: cat,
      occupancyAvg: Number(row.occupancyAvg) || 0,
      pctTimeEmpty: Number(row.pctTimeEmpty) || 0,
      pctTimeFull: Number(row.pctTimeFull) || 0,
      rotation: Number(row.rotation) || 0,
      rotationPerBike: Number(row.rotationPerBike) || 0,
      persistenceProxy: Number(row.persistenceProxy) || 0,
      criticalEpisodeAvgMinutes: 0,
      netImbalance: Number(row.netImbalance) || 0,
      variability: Number(row.variability) || 0,
      unsatisfiedDemandProxy: 0,
    };
    const existing = map.get(row.stationId) ?? [];
    existing.push(metrics);
    map.set(row.stationId, existing);
  }
  return map;
}

// ─── Critical episodes query ─────────────────────────────────────────────────

/**
 * Analyses StationStatus raw records to find consecutive empty/full runs and
 * returns the average and maximum episode duration per station.
 *
 * Uses a gaps-and-islands approach with window functions.
 */
export async function getCriticalEpisodes(days: number): Promise<Map<string, {
  avgEmptyEpisodeMinutes: number;
  avgFullEpisodeMinutes: number;
  maxEmptyEpisodeMinutes: number;
  maxFullEpisodeMinutes: number;
  episodeCount: number;
}>> {
  const safeDays = Math.max(1, Math.min(90, Math.floor(days)));

  // Limit to last N days; raw status table can be large
  const rows = await prisma.$queryRaw<RawCriticalEpisodesRow[]>`
    WITH flagged AS (
      SELECT
        "stationId",
        "recordedAt",
        "bikesAvailable",
        "anchorsFree",
        -- Island ID for empty runs
        ROW_NUMBER() OVER (PARTITION BY "stationId" ORDER BY "recordedAt")
        - ROW_NUMBER() OVER (
            PARTITION BY "stationId",
            CASE WHEN "bikesAvailable" = 0 THEN 1 ELSE 0 END
            ORDER BY "recordedAt"
          ) AS empty_island,
        -- Island ID for full runs
        ROW_NUMBER() OVER (PARTITION BY "stationId" ORDER BY "recordedAt")
        - ROW_NUMBER() OVER (
            PARTITION BY "stationId",
            CASE WHEN "anchorsFree" = 0 THEN 1 ELSE 0 END
            ORDER BY "recordedAt"
          ) AS full_island
      FROM "StationStatus"
      WHERE "recordedAt" >= NOW() - INTERVAL '1 day' * ${safeDays}
    ),
    empty_episodes AS (
      SELECT
        "stationId",
        EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt")))::float / 60 AS duration_minutes
      FROM flagged
      WHERE "bikesAvailable" = 0
      GROUP BY "stationId", empty_island
      HAVING COUNT(*) > 1
    ),
    full_episodes AS (
      SELECT
        "stationId",
        EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt")))::float / 60 AS duration_minutes
      FROM flagged
      WHERE "anchorsFree" = 0
      GROUP BY "stationId", full_island
      HAVING COUNT(*) > 1
    ),
    combined AS (
      SELECT
        COALESCE(e."stationId", f."stationId") AS "stationId",
        AVG(e.duration_minutes)                AS "avgEmptyEpisodeMinutes",
        MAX(e.duration_minutes)                AS "maxEmptyEpisodeMinutes",
        AVG(f.duration_minutes)                AS "avgFullEpisodeMinutes",
        MAX(f.duration_minutes)                AS "maxFullEpisodeMinutes",
        COUNT(DISTINCT e.ctid) + COUNT(DISTINCT f.ctid) AS "episodeCount"
      FROM empty_episodes e
      FULL OUTER JOIN full_episodes f ON e."stationId" = f."stationId"
      GROUP BY 1
    )
    SELECT
      "stationId",
      COALESCE("avgEmptyEpisodeMinutes", 0)::float AS "avgEmptyEpisodeMinutes",
      COALESCE("avgFullEpisodeMinutes", 0)::float  AS "avgFullEpisodeMinutes",
      COALESCE("maxEmptyEpisodeMinutes", 0)::float AS "maxEmptyEpisodeMinutes",
      COALESCE("maxFullEpisodeMinutes", 0)::float  AS "maxFullEpisodeMinutes",
      COALESCE("episodeCount", 0)::int             AS "episodeCount"
    FROM combined;
  `;

  const map = new Map<string, {
    avgEmptyEpisodeMinutes: number;
    avgFullEpisodeMinutes: number;
    maxEmptyEpisodeMinutes: number;
    maxFullEpisodeMinutes: number;
    episodeCount: number;
  }>();

  for (const row of rows) {
    map.set(row.stationId, {
      avgEmptyEpisodeMinutes: Number(row.avgEmptyEpisodeMinutes) || 0,
      avgFullEpisodeMinutes: Number(row.avgFullEpisodeMinutes) || 0,
      maxEmptyEpisodeMinutes: Number(row.maxEmptyEpisodeMinutes) || 0,
      maxFullEpisodeMinutes: Number(row.maxFullEpisodeMinutes) || 0,
      episodeCount: Number(row.episodeCount) || 0,
    });
  }
  return map;
}

// ─── Rotation percentile ─────────────────────────────────────────────────────

/**
 * Returns the percentile rank (0–100) of a station's rotationPerBike
 * within the set of all active stations.
 */
export function computeRotationPercentiles(
  metricsMap: Map<string, StationBaseMetrics & { sampleCount: number }>
): Map<string, number> {
  const entries = Array.from(metricsMap.entries());
  const sorted = [...entries].sort(
    (a, b) => (a[1].rotationPerBike ?? 0) - (b[1].rotationPerBike ?? 0)
  );
  const percentiles = new Map<string, number>();
  sorted.forEach(([stationId], index) => {
    percentiles.set(stationId, Math.round((index / Math.max(sorted.length - 1, 1)) * 100));
  });
  return percentiles;
}

// ─── In-memory distance matrix ───────────────────────────────────────────────

/**
 * Builds a proximity map for all stations within maxDistanceMeters.
 * Computed in-memory using haversine — fast enough for ~130 stations (O(n²) ≈ 16900 ops).
 */
export function buildDistanceMatrix(
  stations: RawStationPoint[],
  currentMetrics: Map<string, StationBaseMetrics & { sampleCount: number }>,
  currentBikes: Map<string, { bikesAvailable: number; anchorsFree: number }>,
  maxDistanceMeters = 500
): Map<string, NearbyStation[]> {
  const matrix = new Map<string, NearbyStation[]>();

  for (const station of stations) {
    const nearby: NearbyStation[] = [];

    for (const other of stations) {
      if (other.id === station.id) continue;

      const distanceMeters = haversineDistanceMeters(
        { latitude: station.lat, longitude: station.lon },
        { latitude: other.lat, longitude: other.lon }
      );

      if (distanceMeters > maxDistanceMeters) continue;

      const walkingTimeMinutes = (distanceMeters * 1.3) / (4500 / 60);
      const otherMetrics = currentMetrics.get(other.id);
      const otherStatus = currentBikes.get(other.id);
      const currentOccupancy =
        otherStatus && otherStatus.bikesAvailable + otherStatus.anchorsFree > 0
          ? otherStatus.bikesAvailable / (otherStatus.bikesAvailable + otherStatus.anchorsFree)
          : 0;
      const historicalRobustness = otherMetrics
        ? Math.max(0, 1 - otherMetrics.pctTimeEmpty - otherMetrics.pctTimeFull)
        : 0;

      nearby.push({
        stationId: other.id,
        distanceMeters,
        walkingTimeMinutes,
        currentOccupancy,
        historicalRobustness,
      });
    }

    nearby.sort((a, b) => a.distanceMeters - b.distanceMeters);
    matrix.set(station.id, nearby);
  }

  return matrix;
}

// ─── Station points helper ───────────────────────────────────────────────────

/** Fetches all active stations with coordinates and capacity. */
export async function getActiveStationPoints(): Promise<RawStationPoint[]> {
  const rows = await prisma.$queryRaw<RawStationPoint[]>`
    SELECT id, lat::float, lon::float, capacity
    FROM "Station"
    WHERE "isActive" = true
    ORDER BY id ASC;
  `;
  return rows.map((r: RawStationPoint) => ({
    id: r.id,
    lat: Number(r.lat),
    lon: Number(r.lon),
    capacity: Number(r.capacity),
  }));
}

// ─── Unsatisfied demand proxy ────────────────────────────────────────────────

/**
 * Estimates unsatisfied demand for each station:
 * hours_at_zero_bikes × avg_rotation_per_hour_in_same_time_band.
 * This is a rough lower-bound proxy — actual lost demand is higher.
 */
export function computeUnsatisfiedDemandProxy(
  globalMetrics: Map<string, StationBaseMetrics & { sampleCount: number }>,
  timeBandMetrics: Map<string, TimeBandMetrics[]>
): Map<string, number> {
  const result = new Map<string, number>();

  for (const [stationId, global] of globalMetrics.entries()) {
    const bandMetrics = timeBandMetrics.get(stationId) ?? [];
    // Find peak time bands where demand is highest
    const peakBands = bandMetrics.filter(
      (b) => b.timeBand === 'morning_peak' || b.timeBand === 'evening_peak'
    );
    const avgPeakRotationPerHour =
      peakBands.length > 0
        ? peakBands.reduce((sum, b) => sum + b.rotation, 0) / peakBands.length / 8
        : global.rotation / Math.max(global.sampleCount, 1);

    const hoursEmpty = global.pctTimeEmpty * global.sampleCount;
    result.set(stationId, hoursEmpty * avgPeakRotationPerHour);
  }

  return result;
}

// ─── Re-export Prisma helper type ────────────────────────────────────────────

export type { RawStationPoint };
