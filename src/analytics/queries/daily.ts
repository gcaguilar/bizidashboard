import { Prisma } from '@/generated/prisma/client';
import { executeRollupPipeline } from '@/analytics/rollup-engine';
import type { RollupResult } from '@/analytics/types';

const DAILY_WATERMARK = 'daily-rollup';

export async function runDailyRollup(cutoff: Date): Promise<RollupResult> {
  const pipeline = {
    id: 'daily',
    watermarkKey: DAILY_WATERMARK,
    sourceQuery: (watermark: Date, windowEnd: Date) => Prisma.sql`
      SELECT "StationStatus"."stationId" as "stationId",
        DATE_TRUNC('day', "StationStatus"."recordedAt")::timestamp as "bucketDate",
        MIN("StationStatus"."bikesAvailable") as "bikesMin",
        MAX("StationStatus"."bikesAvailable") as "bikesMax",
        AVG("StationStatus"."bikesAvailable"::float) as "bikesAvg",
        MIN("StationStatus"."anchorsFree") as "anchorsMin",
        MAX("StationStatus"."anchorsFree") as "anchorsMax",
        AVG("StationStatus"."anchorsFree"::float) as "anchorsAvg",
        COALESCE(
          AVG(
            CASE WHEN "Station".capacity > 0
              THEN "StationStatus"."bikesAvailable"::float / "Station".capacity
              ELSE NULL END
          ), 0
        ) as "occupancyAvg",
        COUNT(*) as "sampleCount"
      FROM "StationStatus"
      JOIN "Station" ON "StationStatus"."stationId" = "Station".id
      WHERE "StationStatus"."recordedAt" > ${watermark}
        AND "StationStatus"."recordedAt" <= ${windowEnd}
      GROUP BY 1, 2
    `,
    sourceColumns: 'stationId,bucketDate,bikesMin,bikesMax,bikesAvg,anchorsMin,anchorsMax,anchorsAvg,occupancyAvg,sampleCount',
    transform: (row: Record<string, unknown>) => ({
      stationId: String(row.stationId),
      bucketDate: row.bucketDate,
      bikesMin: Number(row.bikesMin),
      bikesMax: Number(row.bikesMax),
      bikesAvg: Number(row.bikesAvg),
      anchorsMin: Number(row.anchorsMin),
      anchorsMax: Number(row.anchorsMax),
      anchorsAvg: Number(row.anchorsAvg),
      occupancyAvg: Number(row.occupancyAvg),
      sampleCount: Number(row.sampleCount),
    }),
    upsertQuery: (rows: { stationId: string; bucketDate: unknown; bikesMin: number; bikesMax: number; bikesAvg: number; anchorsMin: number; anchorsMax: number; anchorsAvg: number; occupancyAvg: number; sampleCount: number }[]) => {
      const values = rows.map((r) =>
        Prisma.sql`(${r.stationId}, ${r.bucketDate}, ${r.bikesMin}, ${r.bikesMax}, ${r.bikesAvg}, ${r.anchorsMin}, ${r.anchorsMax}, ${r.anchorsAvg}, ${r.occupancyAvg}, ${r.sampleCount})`
      );
      return Prisma.sql`
        INSERT INTO "DailyStationStat" ("stationId", "bucketDate", "bikesMin", "bikesMax", "bikesAvg", "anchorsMin", "anchorsMax", "anchorsAvg", "occupancyAvg", "sampleCount", "updatedAt")
        VALUES ${Prisma.join(values)}
        ON CONFLICT ("stationId", "bucketDate") DO UPDATE SET
          "bikesMin" = excluded."bikesMin", "bikesMax" = excluded."bikesMax",
          "bikesAvg" = excluded."bikesAvg", "anchorsMin" = excluded."anchorsMin",
          "anchorsMax" = excluded."anchorsMax", "anchorsAvg" = excluded."anchorsAvg",
          "occupancyAvg" = excluded."occupancyAvg", "sampleCount" = excluded."sampleCount",
          "updatedAt" = CURRENT_TIMESTAMP;
      `;
    },
    chunkSize: 10,
  };

  return executeRollupPipeline(pipeline, cutoff);
}
