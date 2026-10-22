import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { getWatermark, setWatermark } from '@/analytics/watermarks';
import type { RollupResult } from '@/analytics/types';

const PATTERN_WATERMARK = 'pattern_rollup';

/**
 * Perfil por estacion, tipo de dia y hora local sobre la ventana de ranking.
 *
 * Se deriva de `StationHeatmapCell` (que `runHeatmapRollup` acaba de escribir
 * para la misma ventana) en vez de releer las ~93k filas horarias: como cada
 * celda guarda su media y su `sampleCount`, reponderar por `sampleCount`
 * reproduce exactamente la media de todos los dias de la ventana. Por eso el
 * job ejecuta el heatmap antes que este rollup. El upsert solo reescribe las
 * filas que cambian (ver `runHeatmapRollup`).
 */
export async function runPatternRollup(cutoff: Date): Promise<RollupResult> {
  const watermark = await getWatermark(PATTERN_WATERMARK, new Date(0));

  if (cutoff <= watermark) {
    return { processedCount: 0, upsertedCount: 0, watermark, cutoff };
  }

  const upserted = await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "StationPattern" ("stationId", "dayType", hour, "bikesAvg", "anchorsAvg", "occupancyAvg", "sampleCount")
    SELECT
      "stationId",
      (CASE WHEN "dayOfWeek" IN (0, 6) THEN 'WEEKEND' ELSE 'WEEKDAY' END)::"DayType",
      hour,
      SUM("bikesAvg" * "sampleCount") / NULLIF(SUM("sampleCount"), 0),
      SUM("anchorsAvg" * "sampleCount") / NULLIF(SUM("sampleCount"), 0),
      SUM("occupancyAvg" * "sampleCount") / NULLIF(SUM("sampleCount"), 0),
      SUM("sampleCount")::int
    FROM "StationHeatmapCell"
    GROUP BY 1, 2, 3
    HAVING SUM("sampleCount") > 0
    ON CONFLICT ("stationId", "dayType", hour) DO UPDATE SET
      "bikesAvg" = excluded."bikesAvg",
      "anchorsAvg" = excluded."anchorsAvg",
      "occupancyAvg" = excluded."occupancyAvg",
      "sampleCount" = excluded."sampleCount"
    WHERE "StationPattern"."sampleCount" IS DISTINCT FROM excluded."sampleCount"
      OR abs("StationPattern"."bikesAvg" - excluded."bikesAvg") > 1e-9
      OR abs("StationPattern"."anchorsAvg" - excluded."anchorsAvg") > 1e-9
      OR abs("StationPattern"."occupancyAvg" - excluded."occupancyAvg") > 1e-9;
  `);

  await setWatermark(PATTERN_WATERMARK, cutoff);

  return { processedCount: upserted, upsertedCount: upserted, watermark: cutoff, cutoff };
}
