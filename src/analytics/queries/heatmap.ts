import { Prisma } from '@/generated/prisma/client';
import { ANALYTICS_WINDOWS } from '@/analytics/types';
import { prisma } from '@/lib/db';
import { getWatermark, setWatermark } from '@/analytics/watermarks';
import { localDow, localHour } from '@/analytics/queries/local-time-sql';
import type { RollupResult } from '@/analytics/types';

const HEATMAP_WATERMARK = 'heatmap_rollup';

/**
 * Celda por estacion, dia de la semana y hora local sobre la ventana de
 * ranking, agregada en SQL y ponderada por `sampleCount`.
 *
 * La ventana es de 14 dias exactos: cada hora entra y sale la misma celda
 * (dia y hora), asi que casi todas las filas recalculadas son identicas. El
 * `WHERE` del upsert solo reescribe las que cambian (<1 %), en vez de generar
 * ~46k tuplas muertas y su WAL cada hora.
 */
export async function runHeatmapRollup(cutoff: Date): Promise<RollupResult> {
  const watermark = await getWatermark(HEATMAP_WATERMARK, new Date(0));

  if (cutoff <= watermark) {
    return { processedCount: 0, upsertedCount: 0, watermark, cutoff };
  }

  const windowEnd = cutoff;
  const windowStart = new Date(
    windowEnd.getTime() - ANALYTICS_WINDOWS.rankingDays * 24 * 60 * 60 * 1000
  );

  const upserted = await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "StationHeatmapCell" ("stationId", "dayOfWeek", hour, "bikesAvg", "anchorsAvg", "occupancyAvg", "sampleCount")
    SELECT
      "stationId",
      ${localDow()},
      ${localHour()},
      SUM("bikesAvg" * "sampleCount") / NULLIF(SUM("sampleCount"), 0),
      SUM("anchorsAvg" * "sampleCount") / NULLIF(SUM("sampleCount"), 0),
      SUM("occupancyAvg" * "sampleCount") / NULLIF(SUM("sampleCount"), 0),
      SUM("sampleCount")::int
    FROM "HourlyStationStat"
    WHERE "bucketStart" > ${windowStart} AND "bucketStart" <= ${windowEnd}
    GROUP BY 1, 2, 3
    HAVING SUM("sampleCount") > 0
    ON CONFLICT ("stationId", "dayOfWeek", hour) DO UPDATE SET
      "bikesAvg" = excluded."bikesAvg",
      "anchorsAvg" = excluded."anchorsAvg",
      "occupancyAvg" = excluded."occupancyAvg",
      "sampleCount" = excluded."sampleCount"
    WHERE "StationHeatmapCell"."sampleCount" IS DISTINCT FROM excluded."sampleCount"
      OR abs("StationHeatmapCell"."bikesAvg" - excluded."bikesAvg") > 1e-9
      OR abs("StationHeatmapCell"."anchorsAvg" - excluded."anchorsAvg") > 1e-9
      OR abs("StationHeatmapCell"."occupancyAvg" - excluded."occupancyAvg") > 1e-9;
  `);

  await setWatermark(HEATMAP_WATERMARK, cutoff);

  return { processedCount: upserted, upsertedCount: upserted, watermark: cutoff, cutoff };
}
