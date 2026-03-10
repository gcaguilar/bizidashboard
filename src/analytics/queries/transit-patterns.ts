import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { ANALYTICS_WINDOWS, DayType } from '@/analytics/types';
import { getLocalBucket } from '@/analytics/time-buckets';
import { forEachSqliteBatch } from '@/analytics/sqlite';
import { getWatermark, setWatermark } from '@/analytics/watermarks';

export interface RollupResult {
  processedCount: number;
  upsertedCount: number;
  watermark: Date;
  cutoff: Date;
}

interface PatternAccumulator {
  transitStopId: string;
  provider: string;
  dayType: DayType;
  hour: number;
  etaSum: number;
  etaSamples: number;
  arrivalPressureSum: number;
  arrivalEventsSum: number;
  staleRateSum: number;
  sampleCount: number;
}

const PATTERN_WATERMARK = 'transit-pattern-rollup';

function parseBucketStart(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  return value.includes('T') ? new Date(value) : new Date(value.replace(' ', 'T') + 'Z');
}

export async function runTransitPatternRollup(cutoff: Date): Promise<RollupResult> {
  const windowStart = new Date(
    cutoff.getTime() - ANALYTICS_WINDOWS.rankingDays * 24 * 60 * 60 * 1000
  );
  const watermark = await getWatermark(PATTERN_WATERMARK, new Date(0));

  if (cutoff <= watermark) {
    return { processedCount: 0, upsertedCount: 0, watermark, cutoff };
  }

  const hourlyStats = await prisma.$queryRaw<
    {
      transitStopId: string;
      provider: string;
      bucketStart: string | Date;
      etaAvg: number | null;
      arrivalPressureAvg: number;
      arrivalEvents: number;
      staleSampleCount: number;
      sampleCount: number;
    }[]
  >`SELECT transitStopId, provider, bucketStart, etaAvg, arrivalPressureAvg, arrivalEvents, staleSampleCount, sampleCount FROM HourlyTransitStopStat WHERE datetime(bucketStart) > datetime(${windowStart}) AND datetime(bucketStart) <= datetime(${cutoff});`;

  const aggregates = new Map<string, PatternAccumulator>();

  for (const stat of hourlyStats) {
    const bucketStart = parseBucketStart(stat.bucketStart);
    const { hour, dayType } = getLocalBucket(bucketStart);
    const key = `${stat.transitStopId}-${dayType}-${hour}`;
    const existing = aggregates.get(key);
    const weight = stat.sampleCount || 0;
    const staleRate = weight > 0 ? stat.staleSampleCount / weight : 0;

    if (existing) {
      if (stat.etaAvg !== null) {
        existing.etaSum += stat.etaAvg * weight;
        existing.etaSamples += weight;
      }
      existing.arrivalPressureSum += stat.arrivalPressureAvg * weight;
      existing.arrivalEventsSum += stat.arrivalEvents;
      existing.staleRateSum += staleRate * weight;
      existing.sampleCount += weight;
    } else {
      aggregates.set(key, {
        transitStopId: stat.transitStopId,
        provider: stat.provider,
        dayType,
        hour,
        etaSum: stat.etaAvg === null ? 0 : stat.etaAvg * weight,
        etaSamples: stat.etaAvg === null ? 0 : weight,
        arrivalPressureSum: stat.arrivalPressureAvg * weight,
        arrivalEventsSum: stat.arrivalEvents,
        staleRateSum: staleRate * weight,
        sampleCount: weight,
      });
    }
  }

  const rows = Array.from(aggregates.values()).map((entry) => {
    const count = entry.sampleCount || 1;
    return {
      transitStopId: entry.transitStopId,
      provider: entry.provider,
      dayType: entry.dayType,
      hour: entry.hour,
      etaAvg: entry.etaSamples > 0 ? entry.etaSum / entry.etaSamples : null,
      arrivalPressureAvg: entry.arrivalPressureSum / count,
      arrivalEventsAvg: entry.arrivalEventsSum / count,
      staleRate: entry.staleRateSum / count,
      sampleCount: entry.sampleCount,
    };
  });

  if (rows.length > 0) {
    await forEachSqliteBatch(rows, 7, async (rowChunk) => {
      const values = rowChunk.map((row) =>
        Prisma.sql`(${row.transitStopId}, ${row.provider}, ${row.dayType}, ${row.hour}, ${row.etaAvg}, ${row.arrivalPressureAvg}, ${row.arrivalEventsAvg}, ${row.staleRate}, ${row.sampleCount})`
      );

      await prisma.$executeRaw`
        INSERT INTO TransitStopPattern (
          transitStopId,
          provider,
          dayType,
          hour,
          etaAvg,
          arrivalPressureAvg,
          arrivalEventsAvg,
          staleRate,
          sampleCount
        )
        VALUES ${Prisma.join(values)}
        ON CONFLICT(transitStopId, dayType, hour) DO UPDATE SET
          provider = excluded.provider,
          etaAvg = excluded.etaAvg,
          arrivalPressureAvg = excluded.arrivalPressureAvg,
          arrivalEventsAvg = excluded.arrivalEventsAvg,
          staleRate = excluded.staleRate,
          sampleCount = excluded.sampleCount;
      `;
    });

    await setWatermark(PATTERN_WATERMARK, cutoff);
  }

  return {
    processedCount: hourlyStats.length,
    upsertedCount: rows.length,
    watermark: rows.length > 0 ? cutoff : watermark,
    cutoff,
  };
}
