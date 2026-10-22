import { Prisma } from '@/generated/prisma/client';
import { coalesceSumDemand, sumDemand } from './demand-sql';
import { localDow, localHour } from './local-time-sql';
import { getCurrentTimeBand } from '@/lib/target-bands';
import { prisma } from '@/lib/db';
import { findWatermark } from '@/analytics/watermarks';
import { haversineDistanceMeters } from '@/lib/geo';
import type {
  NearbyStation,
  RebalancingAvailabilitySummary,
  StationBaseMetrics,
  TimeBandMetrics,
} from '@/types/rebalancing';

export type CriticalEpisodeRow = {
  stationId: string;
  avgEmptyEpisodeMinutes: number;
  avgFullEpisodeMinutes: number;
  maxEmptyEpisodeMinutes: number;
  maxFullEpisodeMinutes: number;
  episodeCount: number;
};

const ALLOWED_RANGE_COLUMNS = ['bucketStart', 'recordedAt'] as const;
type AllowedRangeColumn = (typeof ALLOWED_RANGE_COLUMNS)[number];

function buildRangeFilter(column: AllowedRangeColumn, days: number): Prisma.Sql {
  if (!ALLOWED_RANGE_COLUMNS.includes(column)) {
    throw new Error(`Invalid column name: ${column}`);
  }
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
        "bikesMin",
        "bikesMax",
        "bikesAvg",
        "anchorsMin",
        "anchorsMax",
        "occupancyAvg",
        "bikesAvg" - LAG("bikesAvg") OVER (
          PARTITION BY "stationId"
          ORDER BY "bucketStart"
        ) AS delta
      FROM "HourlyStationStat"
      WHERE ${filter}
    )
    SELECT
      "stationId",
      COALESCE(AVG("occupancyAvg"), 0) AS "occupancyAvg",
      COALESCE(COUNT(*) FILTER (WHERE "bikesMin" <= 0)::float / NULLIF(COUNT(*), 0), 0) AS "pctTimeEmpty",
      COALESCE(COUNT(*) FILTER (WHERE "anchorsMin" <= 0)::float / NULLIF(COUNT(*), 0), 0) AS "pctTimeFull",
      ${coalesceSumDemand()} AS "rotation",
      COALESCE(${sumDemand()} / NULLIF(AVG("bikesAvg"), 0), 0) AS "rotationPerBike",
      COALESCE(COUNT(*) FILTER (WHERE "bikesMax" = "bikesMin")::float / NULLIF(COUNT(*), 0), 0) AS "persistenceProxy",
      COALESCE(STDDEV_POP("occupancyAvg"), 0) AS "variability",
      COALESCE(SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN delta < 0 THEN ABS(delta) ELSE 0 END), 0) AS "netImbalance"
    FROM with_lag
    GROUP BY "stationId"
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

/**
 * Resumen barato para las landings publicas de redistribucion.
 *
 * Devuelve los mismos tres escalares que `buildRebalancingReport` expone en
 * `summary.totalStations` y `kpis.service.systemPctTimeEmpty/systemPctTimeFull`
 * (media por estacion sobre el rollup horario), pero leyendo solo
 * `HourlyStationStat` (~100k filas en 15 dias) en lugar de `StationStatus`
 * (~3M) y sin ejecutar el motor de clasificacion ni el matching de traslados.
 */
export async function getRebalancingAvailabilitySummary(
  days: number = 15
): Promise<RebalancingAvailabilitySummary> {
  const filter = buildRangeFilter('bucketStart', days);

  const rows = await prisma.$queryRaw<
    Array<{
      stationCount: number;
      pctTimeEmpty: number;
      pctTimeFull: number;
      latestBucketStart: Date | string | null;
    }>
  >`
    WITH per_station AS (
      SELECT
        "stationId",
        COUNT(*) FILTER (WHERE "bikesMin" <= 0)::float / NULLIF(COUNT(*), 0) AS "pctTimeEmpty",
        COUNT(*) FILTER (WHERE "anchorsMin" <= 0)::float / NULLIF(COUNT(*), 0) AS "pctTimeFull",
        MAX("bucketStart") AS "latestBucketStart"
      FROM "HourlyStationStat"
      WHERE ${filter}
      GROUP BY "stationId"
    )
    SELECT
      COUNT(*)::int AS "stationCount",
      COALESCE(AVG("pctTimeEmpty"), 0) AS "pctTimeEmpty",
      COALESCE(AVG("pctTimeFull"), 0) AS "pctTimeFull",
      MAX("latestBucketStart") AS "latestBucketStart"
    FROM per_station;
  `;

  const row = rows[0];

  if (!row) {
    return { stationCount: 0, pctTimeEmpty: 0, pctTimeFull: 0, generatedAt: null };
  }

  const latest = row.latestBucketStart;

  return {
    stationCount: Number(row.stationCount ?? 0),
    pctTimeEmpty: Number(row.pctTimeEmpty ?? 0),
    pctTimeFull: Number(row.pctTimeFull ?? 0),
    generatedAt: latest ? new Date(latest).toISOString() : null,
  };
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
      ${localHour()} AS "hourValue",
      ${localDow()} AS "dayOfWeek",
      COALESCE(AVG("occupancyAvg"), 0) AS "occupancyAvg",
      COALESCE(COUNT("stationId") FILTER (WHERE "bikesMin" <= 0)::float / NULLIF(COUNT("stationId"), 0), 0) AS "pctTimeEmpty",
      COALESCE(COUNT("stationId") FILTER (WHERE "anchorsMin" <= 0)::float / NULLIF(COUNT("stationId"), 0), 0) AS "pctTimeFull",
      ${coalesceSumDemand()} AS "rotation",
      COALESCE(${sumDemand()} / NULLIF(AVG("bikesAvg"), 0), 0) AS "rotationPerBike",
      COALESCE(COUNT("stationId") FILTER (WHERE "bikesMax" = "bikesMin")::float / NULLIF(COUNT("stationId"), 0), 0) AS "persistenceProxy",
      COALESCE(STDDEV_POP("occupancyAvg"), 0) AS "variability"
    FROM "HourlyStationStat"
    WHERE ${filter}
    GROUP BY "stationId", ${localHour()}, ${localDow()}
  `;

  const map: Record<string, TimeBandMetrics[]> = {};

  const getDayCategory = (dow: number) => (dow === 0 || dow === 6 ? 'weekend' : 'weekday');

  for (const row of rows) {
    const timeBand = getCurrentTimeBand(row.hourValue);
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

/**
 * Rachas exactas sin bicis o sin anclajes por estacion.
 *
 * Se resuelve con un unico CTE ordenado una vez por estacion: el numero de
 * grupo de cada racha sale de restar dos `ROW_NUMBER()` (el clasico
 * group-and-gaps), y las rachas vacia/llena se apilan con `UNION ALL` antes de
 * agregar. La version anterior repetia el `ROW_NUMBER()` base dos veces y
 * unia las dos tablas de rachas contra `Station` (275 x N x M filas), lo que
 * dominaba el coste del informe sobre ~3M de snapshots.
 *
 * Nota: las estaciones sin ninguna racha no aparecen en el mapa. El consumidor
 * (`buildRebalancingReport`) mantiene el valor por defecto 0, igual que hacia
 * el `LEFT JOIN` anterior.
 */
export async function getCriticalEpisodes(days: number = 15): Promise<Record<string, CriticalEpisodeRow>> {
  return (await getPersistedCriticalEpisodes(days)) ?? getCriticalEpisodesFromSnapshots(days);
}

/** Meses UTC (YYYY-MM) que toca la ventana `[now - days, now]`. */
function monthKeysInWindow(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  while (cursor <= to) {
    keys.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}

/**
 * Las mismas rachas, leidas de `StationCriticalEpisode` (que el job horario
 * mantiene al dia y el sellado cierra cada mes) en vez de recalcularlas con
 * funciones de ventana sobre ~3M de snapshots. Devuelve `null` si algun mes de
 * la ventana no esta precalculado, para caer a la consulta sobre el crudo.
 *
 * Diferencias asumidas: cuenta las rachas que empiezan dentro de la ventana
 * (no las recorta en su inicio), las parte en el cambio de mes UTC, y la racha
 * en curso llega hasta el ultimo refresco horario.
 */
async function getPersistedCriticalEpisodes(
  days: number
): Promise<Record<string, CriticalEpisodeRow> | null> {
  const safeDays = Math.max(1, Math.min(90, Math.floor(days)));
  const now = new Date();
  const from = new Date(now.getTime() - safeDays * 24 * 60 * 60 * 1000);
  const watermarks = await Promise.all(
    monthKeysInWindow(from, now).map((monthKey) => findWatermark(`critical-episodes:${monthKey}`))
  );
  if (watermarks.some((watermark) => watermark === null)) {
    return null;
  }

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
    SELECT
      "stationId",
      COALESCE(AVG("durationMinutes") FILTER (WHERE "kind" = 'empty'), 0) AS "avgEmptyMinutes",
      COALESCE(MAX("durationMinutes") FILTER (WHERE "kind" = 'empty'), 0) AS "maxEmptyMinutes",
      COALESCE(AVG("durationMinutes") FILTER (WHERE "kind" = 'full'), 0) AS "avgFullMinutes",
      COALESCE(MAX("durationMinutes") FILTER (WHERE "kind" = 'full'), 0) AS "maxFullMinutes",
      COUNT(*) AS "episodeCount"
    FROM "StationCriticalEpisode"
    WHERE "startedAt" >= ${from}
    GROUP BY "stationId"
  `;

  return toCriticalEpisodeMap(rows);
}

async function getCriticalEpisodesFromSnapshots(days: number): Promise<Record<string, CriticalEpisodeRow>> {
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
    WITH ordered AS (
      SELECT "stationId", "recordedAt",
        "bikesAvailable" <= 0 AS empty_flag,
        "anchorsFree" <= 0 AS full_flag,
        ROW_NUMBER() OVER (PARTITION BY "stationId" ORDER BY "recordedAt") AS position
      FROM "StationStatus"
      WHERE ${filter}
    ),
    gaps AS (
      SELECT "stationId", "recordedAt", empty_flag, full_flag,
        position - ROW_NUMBER() OVER (PARTITION BY "stationId", empty_flag ORDER BY "recordedAt") AS empty_grp,
        position - ROW_NUMBER() OVER (PARTITION BY "stationId", full_flag ORDER BY "recordedAt") AS full_grp
      FROM ordered
    ),
    episodes AS (
      SELECT "stationId", 'empty' AS kind, MIN("recordedAt") AS started_at, MAX("recordedAt") AS ended_at
      FROM gaps
      WHERE empty_flag
      GROUP BY "stationId", empty_grp
      HAVING MAX("recordedAt") > MIN("recordedAt")
      UNION ALL
      SELECT "stationId", 'full' AS kind, MIN("recordedAt") AS started_at, MAX("recordedAt") AS ended_at
      FROM gaps
      WHERE full_flag
      GROUP BY "stationId", full_grp
      HAVING MAX("recordedAt") > MIN("recordedAt")
    )
    SELECT
      "stationId",
      COALESCE(AVG(duration_min) FILTER (WHERE kind = 'empty'), 0) AS "avgEmptyMinutes",
      COALESCE(MAX(duration_min) FILTER (WHERE kind = 'empty'), 0) AS "maxEmptyMinutes",
      COALESCE(AVG(duration_min) FILTER (WHERE kind = 'full'), 0) AS "avgFullMinutes",
      COALESCE(MAX(duration_min) FILTER (WHERE kind = 'full'), 0) AS "maxFullMinutes",
      COUNT(*) AS "episodeCount"
    FROM (
      SELECT "stationId", kind, EXTRACT(EPOCH FROM (ended_at - started_at)) / 60 AS duration_min
      FROM episodes
    ) durations
    GROUP BY "stationId"
  `;

  return toCriticalEpisodeMap(rows);
}

function toCriticalEpisodeMap(
  rows: Array<{
    stationId: string;
    avgEmptyMinutes: unknown;
    avgFullMinutes: unknown;
    maxEmptyMinutes: unknown;
    maxFullMinutes: unknown;
    episodeCount: unknown;
  }>
): Record<string, CriticalEpisodeRow> {
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

let distanceMatrixCache: {
  key: string;
  matrix: Map<string, NearbyStation[]>;
} | null = null;

export function getStationDistanceMatrix(
  stations: Array<{ id: string; lat: number; lon: number }>,
  maxDistanceMeters: number = 3000
): Map<string, NearbyStation[]> {
  const cacheKey = `${maxDistanceMeters}:${stations
    .map((s) => `${s.id},${s.lat},${s.lon}`)
    .join(';')}`;
  if (distanceMatrixCache?.key === cacheKey) {
    return distanceMatrixCache.matrix;
  }

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

  distanceMatrixCache = { key: cacheKey, matrix };
  return matrix;
}
