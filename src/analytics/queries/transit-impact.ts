import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getWatermark, setWatermark } from '@/analytics/watermarks';

export interface RollupResult {
  processedCount: number;
  upsertedCount: number;
  watermark: Date;
  cutoff: Date;
}

const TRANSIT_IMPACT_WATERMARK = 'transit-impact-rollup';
const TRANSIT_IMPACT_BACKFILL_HOURS = Number(process.env.TRANSIT_IMPACT_BACKFILL_HOURS ?? 6);

function getEffectiveStart(watermark: Date): Date {
  const backfillHours = Math.max(0, Math.floor(TRANSIT_IMPACT_BACKFILL_HOURS));
  const backfillMs = backfillHours * 60 * 60 * 1000;
  return new Date(Math.max(0, watermark.getTime() - backfillMs));
}

export async function runHourlyTransitImpactRollup(cutoff: Date): Promise<RollupResult> {
  const watermark = await getWatermark(TRANSIT_IMPACT_WATERMARK, new Date(0));

  if (cutoff <= watermark) {
    return {
      processedCount: 0,
      upsertedCount: 0,
      watermark,
      cutoff,
    };
  }

  const effectiveStart = getEffectiveStart(watermark);

  const [{ count: processedCount = 0 } = {}] = await prisma.$queryRaw<
    { count: number }[]
  >`SELECT COUNT(*) as count FROM HourlyStationStat WHERE datetime(bucketStart) > datetime(${effectiveStart}) AND datetime(bucketStart) <= datetime(${cutoff});`;

  const rollupCte = Prisma.sql`
    WITH with_lag AS (
      SELECT
        stationId,
        bucketStart,
        bikesAvg - LAG(bikesAvg) OVER (
          PARTITION BY stationId
          ORDER BY datetime(bucketStart)
        ) AS delta
      FROM HourlyStationStat
      WHERE datetime(bucketStart) <= datetime(${cutoff})
    ),
    station_hour AS (
      SELECT
        stationId,
        bucketStart,
        CASE WHEN delta < 0 THEN ABS(delta) ELSE 0 END AS departures
      FROM with_lag
      WHERE delta IS NOT NULL
        AND datetime(bucketStart) > datetime(${effectiveStart})
        AND datetime(bucketStart) <= datetime(${cutoff})
    ),
    transit_hour AS (
      SELECT
        stl.stationId AS stationId,
        ts.provider AS provider,
        strftime('%Y-%m-%d %H:00:00', ts.observedAt) AS bucketStart,
        AVG(COALESCE(ts.arrivalPressure, 0)) AS arrivalPressureAvg,
        SUM(COALESCE(ts.arrivalEvents, 0)) AS arrivalEvents,
        COUNT(*) AS sampleCount
      FROM TransitSnapshot ts
      INNER JOIN StationTransitLink stl
        ON stl.transitStopId = ts.transitStopId
        AND stl.provider = ts.provider
      WHERE datetime(ts.observedAt) > datetime(${effectiveStart})
        AND datetime(ts.observedAt) <= datetime(${cutoff})
        AND ts.isStale = false
      GROUP BY
        stl.stationId,
        ts.provider,
        strftime('%Y-%m-%d %H:00:00', ts.observedAt)
    ),
    rollup AS (
      SELECT
        sh.stationId AS stationId,
        th.provider AS provider,
        sh.bucketStart AS bucketStart,
        sh.departures AS departures,
        th.arrivalPressureAvg AS arrivalPressureAvg,
        th.arrivalEvents AS arrivalEvents,
        th.sampleCount AS sampleCount,
        CASE WHEN th.arrivalEvents > 0 THEN 1 ELSE 0 END AS hasArrivalEvent
      FROM station_hour sh
      INNER JOIN transit_hour th
        ON th.stationId = sh.stationId
        AND th.bucketStart = sh.bucketStart
    )
  `;

  const [{ count: upsertedCount = 0 } = {}] = await prisma.$queryRaw<
    { count: number }[]
  >`
    ${rollupCte}
    SELECT COUNT(*) as count FROM rollup;
  `;

  if (upsertedCount > 0) {
    await prisma.$executeRaw`
      ${rollupCte}
      INSERT INTO HourlyTransitImpact (
        stationId,
        provider,
        bucketStart,
        departures,
        arrivalPressureAvg,
        arrivalEvents,
        sampleCount,
        hasArrivalEvent,
        updatedAt
      )
      SELECT
        stationId,
        provider,
        bucketStart,
        departures,
        arrivalPressureAvg,
        arrivalEvents,
        sampleCount,
        hasArrivalEvent,
        CURRENT_TIMESTAMP
      FROM rollup
      WHERE true
      ON CONFLICT(stationId, provider, bucketStart) DO UPDATE SET
        departures = excluded.departures,
        arrivalPressureAvg = excluded.arrivalPressureAvg,
        arrivalEvents = excluded.arrivalEvents,
        sampleCount = excluded.sampleCount,
        hasArrivalEvent = excluded.hasArrivalEvent,
        updatedAt = CURRENT_TIMESTAMP;
    `;
  }

  await setWatermark(TRANSIT_IMPACT_WATERMARK, cutoff);

  return {
    processedCount: Number(processedCount),
    upsertedCount: Number(upsertedCount),
    watermark: cutoff,
    cutoff,
  };
}
