import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { getWatermark, setWatermark } from '@/analytics/watermarks';
import { chunkRowsForBulkQuery } from '@/analytics/queries/bulk-upsert';
import type { RollupResult } from '@/analytics/types';

export interface RollupPipeline<T> {
  readonly id: string;
  readonly watermarkKey: string;
  readonly sourceQuery: (watermark: Date, cutoff: Date, windowStart?: Date) => Prisma.Sql;
  readonly sourceColumns: string;
  readonly transform: (row: Record<string, unknown>) => T;
  readonly upsertQuery: (rows: T[]) => Prisma.Sql;
  readonly chunkSize: number;
}

export async function executeRollupPipeline<T>(
  pipeline: RollupPipeline<T>,
  cutoff: Date,
  windowStart?: Date
): Promise<RollupResult> {
  const watermark = await getWatermark(pipeline.watermarkKey, new Date(0));

  if (cutoff <= watermark) {
    return {
      processedCount: 0,
      upsertedCount: 0,
      watermark,
      cutoff,
    };
  }

  const sourceRows = await prisma.$queryRaw<Array<Record<string, unknown>>>(
    pipeline.sourceQuery(watermark, cutoff, windowStart)
  );

  const transformed = sourceRows.map(pipeline.transform);

  let upsertedCount = 0;
  if (transformed.length > 0) {
    for (const chunk of chunkRowsForBulkQuery(transformed, pipeline.chunkSize)) {
      upsertedCount += await prisma.$executeRaw(pipeline.upsertQuery(chunk));
    }
  }

  await setWatermark(pipeline.watermarkKey, cutoff);

  return {
    processedCount: sourceRows.length,
    upsertedCount,
    watermark: cutoff,
    cutoff,
  };
}
