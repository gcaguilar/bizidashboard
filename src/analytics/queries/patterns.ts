import { Prisma } from '@/generated/prisma/client';
import { ANALYTICS_WINDOWS } from '@/analytics/types';
import { prisma } from '@/lib/db';
import { getWatermark, setWatermark } from '@/analytics/watermarks';
import { localDow, localHour } from '@/analytics/queries/local-time-sql';
import type { RollupResult } from '@/analytics/types';

const PATTERN_WATERMARK = 'pattern_rollup';

/**
 * Perfil por estacion, tipo de dia y hora local sobre la ventana de ranking.
 * Se agrega en SQL, ponderando por `sampleCount`, de modo que cada celda es la
 * media de todos los dias de la ventana y no solo del ultimo que se escribio.
 */
export async function runPatternRollup(cutoff: Date): Promise<RollupResult> {
  const watermark = await getWatermark(PATTERN_WATERMARK, new Date(0));

  if (cutoff <= watermark) {
    return { processedCount: 0, upsertedCount: 0, watermark, cutoff };
  }

  const windowEnd = cutoff;
  const windowStart = new Date(
    windowEnd.getTime() - ANALYTICS_WINDOWS.rankingDays * 24 * 60 * 60 * 1000
  );

  const upserted = await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "StationPattern" ("stationId", "dayType", hour, "bikesAvg", "anchorsAvg", "occupancyAvg", "sampleCount")
    SELECT
      "stationId",
      (CASE WHEN ${localDow()} IN (0, 6) THEN 'WEEKEND' ELSE 'WEEKDAY' END)::"DayType",
      ${localHour()},
      SUM("bikesAvg" * "sampleCount") / NULLIF(SUM("sampleCount"), 0),
      SUM("anchorsAvg" * "sampleCount") / NULLIF(SUM("sampleCount"), 0),
      SUM("occupancyAvg" * "sampleCount") / NULLIF(SUM("sampleCount"), 0),
      SUM("sampleCount")::int
    FROM "HourlyStationStat"
    WHERE "bucketStart" > ${windowStart} AND "bucketStart" <= ${windowEnd}
    GROUP BY 1, 2, 3
    HAVING SUM("sampleCount") > 0
    ON CONFLICT ("stationId", "dayType", hour) DO UPDATE SET
      "bikesAvg" = excluded."bikesAvg",
      "anchorsAvg" = excluded."anchorsAvg",
      "occupancyAvg" = excluded."occupancyAvg",
      "sampleCount" = excluded."sampleCount";
  `);

  await setWatermark(PATTERN_WATERMARK, cutoff);

  return { processedCount: upserted, upsertedCount: upserted, watermark: cutoff, cutoff };
}
