import { Prisma } from '@/generated/prisma/client';
import { executeRollupPipeline } from '@/analytics/rollup-engine';
import type { RollupResult } from '@/analytics/types';

const HOURLY_WATERMARK = 'hourly-rollup';

export async function runHourlyRollup(cutoff: Date): Promise<RollupResult> {
  const pipeline = {
    id: 'hourly',
    watermarkKey: HOURLY_WATERMARK,
    sourceQuery: (watermark: Date, windowEnd: Date) => Prisma.sql`
      SELECT "StationStatus"."stationId" as "stationId",
        DATE_TRUNC('hour', "StationStatus"."recordedAt") as "bucketStart",
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
    sourceColumns: 'stationId,bucketStart,bikesMin,bikesMax,bikesAvg,anchorsMin,anchorsMax,anchorsAvg,occupancyAvg,sampleCount',
    transform: (row: Record<string, unknown>) => ({
      stationId: String(row.stationId),
      bucketStart: row.bucketStart,
      bikesMin: Number(row.bikesMin),
      bikesMax: Number(row.bikesMax),
      bikesAvg: Number(row.bikesAvg),
      anchorsMin: Number(row.anchorsMin),
      anchorsMax: Number(row.anchorsMax),
      anchorsAvg: Number(row.anchorsAvg),
      occupancyAvg: Number(row.occupancyAvg),
      sampleCount: Number(row.sampleCount),
    }),
    upsertQuery: (rows: { stationId: string; bucketStart: unknown; bikesMin: number; bikesMax: number; bikesAvg: number; anchorsMin: number; anchorsMax: number; anchorsAvg: number; occupancyAvg: number; sampleCount: number }[]) => {
      const values = rows.map((r) =>
        Prisma.sql`(${r.stationId}, ${r.bucketStart}, ${r.bikesMin}, ${r.bikesMax}, ${r.bikesAvg}, ${r.anchorsMin}, ${r.anchorsMax}, ${r.anchorsAvg}, ${r.occupancyAvg}, ${r.sampleCount})`
      );
      return Prisma.sql`
        INSERT INTO "HourlyStationStat" ("stationId", "bucketStart", "bikesMin", "bikesMax", "bikesAvg", "anchorsMin", "anchorsMax", "anchorsAvg", "occupancyAvg", "sampleCount", "updatedAt")
        VALUES ${Prisma.join(values)}
        ON CONFLICT ("stationId", "bucketStart") DO UPDATE SET
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
