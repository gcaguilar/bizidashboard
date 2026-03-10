import { Prisma, TransitProvider } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getWatermark, setWatermark } from '@/analytics/watermarks';

export interface RollupResult {
  processedCount: number;
  upsertedCount: number;
  watermark: Date;
  cutoff: Date;
}

const HOURLY_TRANSIT_WATERMARK = 'transit-hourly-rollup';

export async function runHourlyTransitStopRollup(cutoff: Date): Promise<RollupResult> {
  const watermark = await getWatermark(HOURLY_TRANSIT_WATERMARK, new Date(0));

  const [{ count: processedCount = 0 } = {}] = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*) as count
    FROM TransitSnapshot
    WHERE observedAt > ${watermark}
      AND observedAt <= ${cutoff};
  `;

  const rollupCte = Prisma.sql`
    WITH rollup AS (
      SELECT
        ts.transitStopId AS transitStopId,
        ts.provider AS provider,
        strftime('%Y-%m-%d %H:00:00', ts.observedAt) AS bucketStart,
        MIN(ts.etaMinutes) AS etaMin,
        AVG(CAST(ts.etaMinutes AS REAL)) AS etaAvg,
        MAX(ts.etaMinutes) AS etaMax,
        AVG(COALESCE(ts.arrivalPressure, 0)) AS arrivalPressureAvg,
        SUM(COALESCE(ts.arrivalEvents, 0)) AS arrivalEvents,
        COUNT(*) AS sampleCount,
        SUM(CASE WHEN ts.isStale THEN 1 ELSE 0 END) AS staleSampleCount,
        SUM(CASE WHEN ts.isStale = false AND ts.etaMinutes IS NOT NULL THEN 1 ELSE 0 END) AS realtimeSampleCount
      FROM TransitSnapshot ts
      WHERE ts.observedAt > ${watermark}
        AND ts.observedAt <= ${cutoff}
      GROUP BY ts.transitStopId, ts.provider, strftime('%Y-%m-%d %H:00:00', ts.observedAt)
    )
  `;

  const [{ count: upsertedCount = 0 } = {}] = await prisma.$queryRaw<{ count: number }[]>`
    ${rollupCte}
    SELECT COUNT(*) as count FROM rollup;
  `;

  if (upsertedCount > 0) {
    await prisma.$executeRaw`
      ${rollupCte}
      INSERT INTO HourlyTransitStopStat (
        transitStopId,
        provider,
        bucketStart,
        etaMin,
        etaAvg,
        etaMax,
        arrivalPressureAvg,
        arrivalEvents,
        sampleCount,
        staleSampleCount,
        realtimeSampleCount,
        updatedAt
      )
      SELECT
        transitStopId,
        provider,
        bucketStart,
        etaMin,
        etaAvg,
        etaMax,
        arrivalPressureAvg,
        arrivalEvents,
        sampleCount,
        staleSampleCount,
        realtimeSampleCount,
        CURRENT_TIMESTAMP
      FROM rollup
      WHERE true
      ON CONFLICT(transitStopId, bucketStart) DO UPDATE SET
        provider = excluded.provider,
        etaMin = excluded.etaMin,
        etaAvg = excluded.etaAvg,
        etaMax = excluded.etaMax,
        arrivalPressureAvg = excluded.arrivalPressureAvg,
        arrivalEvents = excluded.arrivalEvents,
        sampleCount = excluded.sampleCount,
        staleSampleCount = excluded.staleSampleCount,
        realtimeSampleCount = excluded.realtimeSampleCount,
        updatedAt = CURRENT_TIMESTAMP;
    `;
  }

  const [{ maxObservedAt = null } = {}] = await prisma.$queryRaw<{ maxObservedAt: string | null }[]>`
    SELECT MAX(observedAt) as maxObservedAt
    FROM TransitSnapshot
    WHERE observedAt > ${watermark}
      AND observedAt <= ${cutoff};
  `;

  const nextWatermark = maxObservedAt ? new Date(maxObservedAt) : watermark;

  if (maxObservedAt) {
    await setWatermark(HOURLY_TRANSIT_WATERMARK, nextWatermark);
  }

  return {
    processedCount: Number(processedCount),
    upsertedCount: Number(upsertedCount),
    watermark: nextWatermark,
    cutoff,
  };
}

export function toTransitProvider(mode: string): TransitProvider {
  return mode === 'tram' ? TransitProvider.TRAM : TransitProvider.BUS;
}
