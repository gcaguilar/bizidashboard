import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { ANALYTICS_WINDOWS } from '@/analytics/types';
import { getLocalBucket } from '@/analytics/time-buckets';
import { getWatermark, setWatermark } from '@/analytics/watermarks';

export interface RollupResult {
  processedCount: number;
  upsertedCount: number;
  watermark: Date;
  cutoff: Date;
}

interface HeatmapAccumulator {
  stationId: string;
  dayOfWeek: number;
  hour: number;
  bikesSum: number;
  anchorsSum: number;
  occupancySum: number;
  sampleCount: number;
}

const HEATMAP_WATERMARK = 'heatmap_rollup';

function parseBucketStart(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  if (value.includes('T')) {
    return new Date(value);
  }

  return new Date(value.replace(' ', 'T') + 'Z');
}

export async function runHeatmapRollup(cutoff: Date): Promise<RollupResult> {
  const windowEnd = cutoff;
  const windowStart = new Date(
    windowEnd.getTime() - ANALYTICS_WINDOWS.rankingDays * 24 * 60 * 60 * 1000
  );
  const watermark = await getWatermark(HEATMAP_WATERMARK, new Date(0));

  if (windowEnd <= watermark) {
    return {
      processedCount: 0,
      upsertedCount: 0,
      watermark,
      cutoff,
    };
  }

  const hourlyStats = await prisma.$queryRaw<
    {
      stationId: string;
      bucketStart: string | Date;
      bikesAvg: number;
      anchorsAvg: number;
      occupancyAvg: number;
      sampleCount: number;
    }[]
  >`SELECT "stationId", "bucketStart", "bikesAvg", "anchorsAvg", "occupancyAvg", "sampleCount" FROM "HourlyStationStat" WHERE "bucketStart" > ${windowStart} AND "bucketStart" <= ${windowEnd};`;

  const aggregates = new Map<string, HeatmapAccumulator>();

  for (const stat of hourlyStats) {
    const bucketStart = parseBucketStart(stat.bucketStart);
    const { hour, dayOfWeek } = getLocalBucket(bucketStart);
    const key = `${stat.stationId}-${dayOfWeek}-${hour}`;
    const existing = aggregates.get(key);
    const weight = Number(stat.sampleCount) || 0;

    if (existing) {
      existing.bikesSum += Number(stat.bikesAvg) * weight;
      existing.anchorsSum += Number(stat.anchorsAvg) * weight;
      existing.occupancySum += Number(stat.occupancyAvg) * weight;
      existing.sampleCount += weight;
    } else {
      aggregates.set(key, {
        stationId: stat.stationId,
        dayOfWeek,
        hour,
        bikesSum: Number(stat.bikesAvg) * weight,
        anchorsSum: Number(stat.anchorsAvg) * weight,
        occupancySum: Number(stat.occupancyAvg) * weight,
        sampleCount: weight,
      });
    }
  }

  const rows = Array.from(aggregates.values())
    .filter((entry) => entry.sampleCount > 0)
    .map((entry) => ({
      stationId: entry.stationId,
      dayOfWeek: entry.dayOfWeek,
      hour: entry.hour,
      bikesAvg: entry.bikesSum / entry.sampleCount,
      anchorsAvg: entry.anchorsSum / entry.sampleCount,
      occupancyAvg: entry.occupancySum / entry.sampleCount,
      sampleCount: entry.sampleCount,
    }));

  if (rows.length > 0) {
    const values = rows.map((row) =>
      Prisma.sql`(${row.stationId}, ${row.dayOfWeek}, ${row.hour}, ${row.bikesAvg}, ${row.anchorsAvg}, ${row.occupancyAvg}, ${row.sampleCount})`
    );

    await prisma.$executeRaw`
      INSERT INTO "StationHeatmapCell" (
        "stationId",
        "dayOfWeek",
        hour,
        "bikesAvg",
        "anchorsAvg",
        "occupancyAvg",
        "sampleCount"
      )
      VALUES ${Prisma.join(values)}
      ON CONFLICT("stationId", "dayOfWeek", hour) DO UPDATE SET
        "bikesAvg" = excluded."bikesAvg",
        "anchorsAvg" = excluded."anchorsAvg",
        "occupancyAvg" = excluded."occupancyAvg",
        "sampleCount" = excluded."sampleCount";
    `;
  }

  await setWatermark(HEATMAP_WATERMARK, windowEnd);

  return {
    processedCount: hourlyStats.length,
    upsertedCount: rows.length,
    watermark: windowEnd,
    cutoff,
  };
}
