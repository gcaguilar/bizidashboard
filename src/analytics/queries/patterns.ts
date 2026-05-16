import { Prisma } from '@/generated/prisma/client';
import { ANALYTICS_WINDOWS } from '@/analytics/types';
import { executeRollupPipeline } from '@/analytics/rollup-engine';
import type { RollupResult } from '@/analytics/types';

const PATTERN_WATERMARK = 'pattern_rollup';

export async function runPatternRollup(cutoff: Date): Promise<RollupResult> {
  const windowEnd = cutoff;
  const windowStart = new Date(
    windowEnd.getTime() - ANALYTICS_WINDOWS.rankingDays * 24 * 60 * 60 * 1000
  );

  const pipeline = {
    id: 'pattern',
    watermarkKey: PATTERN_WATERMARK,
    sourceQuery: () => Prisma.sql`
      SELECT "stationId", "bucketStart", "bikesAvg", "anchorsAvg", "occupancyAvg", "sampleCount"
      FROM "HourlyStationStat"
      WHERE "bucketStart" > ${windowStart} AND "bucketStart" <= ${windowEnd}
    `,
    sourceColumns: 'stationId,bucketStart,bikesAvg,anchorsAvg,occupancyAvg,sampleCount',
    transform: (row: Record<string, unknown>) => ({
      stationId: String(row.stationId),
      bucketStart: row.bucketStart,
      bikesAvg: Number(row.bikesAvg),
      anchorsAvg: Number(row.anchorsAvg),
      occupancyAvg: Number(row.occupancyAvg),
      sampleCount: Number(row.sampleCount),
    }),
    upsertQuery: (rows: { stationId: string; dayType: string; hour: number; bikesAvg: number; anchorsAvg: number; occupancyAvg: number; sampleCount: number }[]) => {
      const values = rows.map((r) =>
        Prisma.sql`(${r.stationId}, ${r.dayType}, ${r.hour}, ${r.bikesAvg}, ${r.anchorsAvg}, ${r.occupancyAvg}, ${r.sampleCount})`
      );
      return Prisma.sql`
        INSERT INTO "StationPattern" ("stationId", "dayType", hour, "bikesAvg", "anchorsAvg", "occupancyAvg", "sampleCount")
        VALUES ${Prisma.join(values)}
        ON CONFLICT ("stationId", "dayType", hour) DO UPDATE SET
          "bikesAvg" = excluded."bikesAvg",
          "anchorsAvg" = excluded."anchorsAvg",
          "occupancyAvg" = excluded."occupancyAvg",
          "sampleCount" = excluded."sampleCount";
      `;
    },
    chunkSize: 7,
  };

  return executeRollupPipeline(pipeline, cutoff, windowStart);
}
