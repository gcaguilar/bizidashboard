import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { ANALYTICS_WINDOWS, DayType } from '@/analytics/types';
import { getLocalBucket } from '@/analytics/time-buckets';
import { getWatermark, setWatermark } from '@/analytics/watermarks';

export interface RollupResult {
  processedCount: number;
  upsertedCount: number;
  watermark: Date;
  cutoff: Date;
}

interface PatternAccumulator {
  stationId: string;
  dayType: DayType;
  hour: number;
  bikesSum: number;
  anchorsSum: number;
  occupancySum: number;
  sampleCount: number;
}

const PATTERN_WATERMARK = 'pattern_rollup';

export async function runPatternRollup(cutoff: Date): Promise<RollupResult> {
  const windowEnd = cutoff;
  const windowStart = new Date(
    windowEnd.getTime() - ANALYTICS_WINDOWS.rankingDays * 24 * 60 * 60 * 1000
  );
  const watermark = await getWatermark(PATTERN_WATERMARK, new Date(0));

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
      bucketStart: string;
      bikesAvg: number;
      anchorsAvg: number;
      occupancyAvg: number;
      sampleCount: number;
    }[]
  >`SELECT stationId, bucketStart, bikesAvg, anchorsAvg, occupancyAvg, sampleCount FROM HourlyStationStat WHERE bucketStart > ${windowStart} AND bucketStart <= ${windowEnd};`;

  const aggregates = new Map<string, PatternAccumulator>();

  for (const stat of hourlyStats) {
    const bucketStart = new Date(stat.bucketStart.replace(' ', 'T') + 'Z');
    const { hour, dayType } = getLocalBucket(bucketStart);
    const key = `${stat.stationId}-${dayType}-${hour}`;
    const existing = aggregates.get(key);
    const weight = stat.sampleCount || 0;

    if (existing) {
      existing.bikesSum += stat.bikesAvg * weight;
      existing.anchorsSum += stat.anchorsAvg * weight;
      existing.occupancySum += stat.occupancyAvg * weight;
      existing.sampleCount += weight;
    } else {
      aggregates.set(key, {
        stationId: stat.stationId,
        dayType,
        hour,
        bikesSum: stat.bikesAvg * weight,
        anchorsSum: stat.anchorsAvg * weight,
        occupancySum: stat.occupancyAvg * weight,
        sampleCount: weight,
      });
    }
  }

  const rows = Array.from(aggregates.values()).map((entry) => {
    const count = entry.sampleCount || 1;
    return {
      stationId: entry.stationId,
      dayType: entry.dayType,
      hour: entry.hour,
      bikesAvg: entry.bikesSum / count,
      anchorsAvg: entry.anchorsSum / count,
      occupancyAvg: entry.occupancySum / count,
      sampleCount: entry.sampleCount,
    };
  });

  if (rows.length > 0) {
    const values = rows.map((row) =>
      Prisma.sql`(${row.stationId}, ${row.dayType}, ${row.hour}, ${row.bikesAvg}, ${row.anchorsAvg}, ${row.occupancyAvg}, ${row.sampleCount})`
    );

    await prisma.$executeRaw`
      INSERT INTO StationPattern (
        stationId,
        dayType,
        hour,
        bikesAvg,
        anchorsAvg,
        occupancyAvg,
        sampleCount
      )
      VALUES ${Prisma.join(values)}
      ON CONFLICT(stationId, dayType, hour) DO UPDATE SET
        bikesAvg = excluded.bikesAvg,
        anchorsAvg = excluded.anchorsAvg,
        occupancyAvg = excluded.occupancyAvg,
        sampleCount = excluded.sampleCount;
    `;

    await setWatermark(PATTERN_WATERMARK, windowEnd);
  }

  return {
    processedCount: hourlyStats.length,
    upsertedCount: rows.length,
    watermark: rows.length > 0 ? windowEnd : watermark,
    cutoff,
  };
}
