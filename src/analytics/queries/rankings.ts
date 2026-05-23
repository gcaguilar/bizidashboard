import { Prisma } from '@/generated/prisma/client';
import { ANALYTICS_WINDOWS } from '@/analytics/types';
import { executeRollupPipeline } from '@/analytics/rollup-engine';
import type { RollupResult } from '@/analytics/types';

const RANKING_WATERMARK = 'ranking_rollup';

export async function runRankingRollup(cutoff: Date): Promise<RollupResult> {
  const windowEnd = cutoff;
  const windowStart = new Date(
    windowEnd.getTime() - ANALYTICS_WINDOWS.rankingDays * 24 * 60 * 60 * 1000
  );

  const pipeline = {
    id: 'ranking',
    watermarkKey: RANKING_WATERMARK,
    sourceQuery: (watermark: Date, queryEnd: Date) => Prisma.sql`
      SELECT "stationId" as "stationId",
        SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) as "turnoverScore",
        SUM(CASE WHEN "bikesAvg" <= 1 THEN 1 ELSE 0 END) as "emptyHours",
        SUM(CASE WHEN "anchorsAvg" <= 1 THEN 1 ELSE 0 END) as "fullHours",
        COUNT(*) as "totalHours"
      FROM "HourlyStationStat"
      WHERE "bucketStart" > ${windowStart}
        AND "bucketStart" <= ${queryEnd}
      GROUP BY "stationId"
    `,
    sourceColumns: 'stationId,turnoverScore,emptyHours,fullHours,totalHours',
    transform: (row: Record<string, unknown>) => ({
      stationId: String(row.stationId),
      turnoverScore: Number(row.turnoverScore),
      emptyHours: Number(row.emptyHours),
      fullHours: Number(row.fullHours),
      totalHours: Number(row.totalHours),
      windowStart,
      windowEnd: cutoff,
    }),
    upsertQuery: (rows: { stationId: string; turnoverScore: number; emptyHours: number; fullHours: number; totalHours: number; windowStart: Date; windowEnd: Date }[]) => {
      const values = rows.map((r) =>
        Prisma.sql`(${r.stationId}, ${r.turnoverScore}, ${r.emptyHours}, ${r.fullHours}, ${r.totalHours}, ${r.windowStart}, ${r.windowEnd})`
      );
      return Prisma.sql`
        INSERT INTO "StationRanking" ("stationId", "turnoverScore", "emptyHours", "fullHours", "totalHours", "windowStart", "windowEnd", "updatedAt")
        VALUES ${Prisma.join(values)}
        ON CONFLICT ("stationId", "windowStart", "windowEnd") DO UPDATE SET
          "turnoverScore" = excluded."turnoverScore",
          "emptyHours" = excluded."emptyHours",
          "fullHours" = excluded."fullHours",
          "totalHours" = excluded."totalHours",
          "updatedAt" = CURRENT_TIMESTAMP;
      `;
    },
    chunkSize: 7,
  };

  return executeRollupPipeline(pipeline, cutoff, windowStart);
}
