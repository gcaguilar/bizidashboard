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

const RANKING_WATERMARK = 'ranking_rollup';

export async function runRankingRollup(cutoff: Date): Promise<RollupResult> {
  const windowEnd = cutoff;
  const windowStart = new Date(
    windowEnd.getTime() - ANALYTICS_WINDOWS.rankingDays * 24 * 60 * 60 * 1000
  );
  const watermark = await getWatermark(RANKING_WATERMARK, new Date(0));

  if (windowEnd <= watermark) {
    return {
      processedCount: 0,
      upsertedCount: 0,
      watermark,
      cutoff,
    };
  }

  const [{ count: processedCount = 0 } = {}] = await prisma.$queryRaw<
    { count: number }[]
  >`SELECT COUNT(*) as count FROM HourlyStationStat WHERE bucketStart > ${windowStart} AND bucketStart <= ${windowEnd};`;

  const rollupCte = Prisma.sql`
    WITH rollup AS (
      SELECT
        stationId as stationId,
        SUM((bikesMax - bikesMin) + (anchorsMax - anchorsMin)) as turnoverScore,
        SUM(CASE WHEN bikesAvg <= 1 THEN 1 ELSE 0 END) as emptyHours,
        SUM(CASE WHEN anchorsAvg <= 1 THEN 1 ELSE 0 END) as fullHours,
        COUNT(*) as totalHours
      FROM HourlyStationStat
      WHERE bucketStart > ${windowStart}
        AND bucketStart <= ${windowEnd}
      GROUP BY stationId
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
      INSERT INTO StationRanking (
        stationId,
        turnoverScore,
        emptyHours,
        fullHours,
        totalHours,
        windowStart,
        windowEnd,
        updatedAt
      )
      SELECT
        stationId,
        turnoverScore,
        emptyHours,
        fullHours,
        totalHours,
        ${windowStart},
        ${windowEnd},
        CURRENT_TIMESTAMP
      FROM rollup
      ON CONFLICT(stationId, windowStart, windowEnd) DO UPDATE SET
        turnoverScore = excluded.turnoverScore,
        emptyHours = excluded.emptyHours,
        fullHours = excluded.fullHours,
        totalHours = excluded.totalHours,
        updatedAt = CURRENT_TIMESTAMP;
    `;

    await setWatermark(RANKING_WATERMARK, windowEnd);
  }

  return {
    processedCount: Number(processedCount),
    upsertedCount: Number(upsertedCount),
    watermark: upsertedCount > 0 ? windowEnd : watermark,
    cutoff,
  };
}
