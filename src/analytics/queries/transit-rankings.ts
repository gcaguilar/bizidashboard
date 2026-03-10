import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { ANALYTICS_WINDOWS } from '@/analytics/types';
import { getWatermark, setWatermark } from '@/analytics/watermarks';

export interface RollupResult {
  processedCount: number;
  upsertedCount: number;
  watermark: Date;
  cutoff: Date;
}

const TRANSIT_RANKING_WATERMARK = 'transit-ranking-rollup';

export async function runTransitRankingRollup(cutoff: Date): Promise<RollupResult> {
  const windowEnd = cutoff;
  const windowStart = new Date(
    windowEnd.getTime() - ANALYTICS_WINDOWS.rankingDays * 24 * 60 * 60 * 1000
  );
  const watermark = await getWatermark(TRANSIT_RANKING_WATERMARK, new Date(0));

  if (windowEnd <= watermark) {
    return { processedCount: 0, upsertedCount: 0, watermark, cutoff };
  }

  const [{ count: processedCount = 0 } = {}] = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*) as count
    FROM HourlyTransitStopStat
    WHERE datetime(bucketStart) > datetime(${windowStart})
      AND datetime(bucketStart) <= datetime(${windowEnd});
  `;

  const rollupCte = Prisma.sql`
    WITH rollup AS (
      SELECT
        transitStopId,
        provider,
        AVG(CAST(staleSampleCount AS REAL) / CASE WHEN sampleCount <= 0 THEN 1 ELSE sampleCount END) AS staleRate,
        AVG(etaAvg) AS avgEta,
        SUM(CASE WHEN realtimeSampleCount <= 0 THEN 1 ELSE 0 END) AS noRealtimeHours,
        COUNT(*) AS totalHours,
        (
          AVG(CAST(staleSampleCount AS REAL) / CASE WHEN sampleCount <= 0 THEN 1 ELSE sampleCount END) * 70
          + (SUM(CASE WHEN realtimeSampleCount <= 0 THEN 1 ELSE 0 END) * 30.0 / CASE WHEN COUNT(*) <= 0 THEN 1 ELSE COUNT(*) END)
          + COALESCE(MIN(20, AVG(etaAvg)), 0)
        ) AS criticalityScore
      FROM HourlyTransitStopStat
      WHERE datetime(bucketStart) > datetime(${windowStart})
        AND datetime(bucketStart) <= datetime(${windowEnd})
      GROUP BY transitStopId, provider
    )
  `;

  const [{ count: upsertedCount = 0 } = {}] = await prisma.$queryRaw<{ count: number }[]>`
    ${rollupCte}
    SELECT COUNT(*) as count FROM rollup;
  `;

  if (upsertedCount > 0) {
    await prisma.$executeRaw`
      ${rollupCte}
      INSERT INTO TransitStopRanking (
        transitStopId,
        provider,
        criticalityScore,
        staleRate,
        avgEta,
        noRealtimeHours,
        totalHours,
        windowStart,
        windowEnd,
        updatedAt
      )
      SELECT
        transitStopId,
        provider,
        criticalityScore,
        staleRate,
        avgEta,
        noRealtimeHours,
        totalHours,
        ${windowStart},
        ${windowEnd},
        CURRENT_TIMESTAMP
      FROM rollup
      WHERE true
      ON CONFLICT(transitStopId, windowStart, windowEnd) DO UPDATE SET
        provider = excluded.provider,
        criticalityScore = excluded.criticalityScore,
        staleRate = excluded.staleRate,
        avgEta = excluded.avgEta,
        noRealtimeHours = excluded.noRealtimeHours,
        totalHours = excluded.totalHours,
        updatedAt = CURRENT_TIMESTAMP;
    `;

    await setWatermark(TRANSIT_RANKING_WATERMARK, windowEnd);
  }

  return {
    processedCount: Number(processedCount),
    upsertedCount: Number(upsertedCount),
    watermark: upsertedCount > 0 ? windowEnd : watermark,
    cutoff,
  };
}
