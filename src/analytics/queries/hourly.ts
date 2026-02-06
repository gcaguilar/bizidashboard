import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getWatermark, setWatermark } from '@/analytics/watermarks';

export interface RollupResult {
  processedCount: number;
  upsertedCount: number;
  watermark: Date;
  cutoff: Date;
}

const HOURLY_WATERMARK = 'hourly-rollup';

export async function runHourlyRollup(cutoff: Date): Promise<RollupResult> {
  const watermark = await getWatermark(HOURLY_WATERMARK, new Date(0));

  const [{ count: processedCount = 0 } = {}] = await prisma.$queryRaw<
    { count: number }[]
  >`SELECT COUNT(*) as count FROM StationStatus WHERE recordedAt > ${watermark} AND recordedAt <= ${cutoff};`;

  const rollupCte = Prisma.sql`
    WITH rollup AS (
      SELECT
        StationStatus.stationId as stationId,
        strftime('%Y-%m-%d %H:00:00', StationStatus.recordedAt) as bucketStart,
        MIN(StationStatus.bikesAvailable) as bikesMin,
        MAX(StationStatus.bikesAvailable) as bikesMax,
        AVG(CAST(StationStatus.bikesAvailable AS REAL)) as bikesAvg,
        MIN(StationStatus.anchorsFree) as anchorsMin,
        MAX(StationStatus.anchorsFree) as anchorsMax,
        AVG(CAST(StationStatus.anchorsFree AS REAL)) as anchorsAvg,
        COALESCE(
          AVG(
            CASE
              WHEN Station.capacity > 0
                THEN CAST(StationStatus.bikesAvailable AS REAL) / Station.capacity
              ELSE NULL
            END
          ),
          0
        ) as occupancyAvg,
        COUNT(*) as sampleCount
      FROM StationStatus
      JOIN Station ON StationStatus.stationId = Station.id
      WHERE StationStatus.recordedAt > ${watermark}
        AND StationStatus.recordedAt <= ${cutoff}
      GROUP BY StationStatus.stationId, strftime('%Y-%m-%d %H:00:00', StationStatus.recordedAt)
    )
  `;

  const [{ count: upsertedCount = 0 } = {}] = await prisma.$queryRaw<
    { count: number }[]
  >`
    ${rollupCte}
    SELECT COUNT(*) as count FROM rollup;
  `;

  if (upsertedCount > 0) {
    await prisma.$executeRaw`
      ${rollupCte}
      INSERT INTO HourlyStationStat (
        stationId,
        bucketStart,
        bikesMin,
        bikesMax,
        bikesAvg,
        anchorsMin,
        anchorsMax,
        anchorsAvg,
        occupancyAvg,
        sampleCount,
        updatedAt
      )
      SELECT
        stationId,
        bucketStart,
        bikesMin,
        bikesMax,
        bikesAvg,
        anchorsMin,
        anchorsMax,
        anchorsAvg,
        occupancyAvg,
        sampleCount,
        CURRENT_TIMESTAMP
      FROM rollup
      ON CONFLICT(stationId, bucketStart) DO UPDATE SET
        bikesMin = excluded.bikesMin,
        bikesMax = excluded.bikesMax,
        bikesAvg = excluded.bikesAvg,
        anchorsMin = excluded.anchorsMin,
        anchorsMax = excluded.anchorsMax,
        anchorsAvg = excluded.anchorsAvg,
        occupancyAvg = excluded.occupancyAvg,
        sampleCount = excluded.sampleCount,
        updatedAt = CURRENT_TIMESTAMP;
    `;
  }

  const [{ maxRecordedAt = null } = {}] = await prisma.$queryRaw<
    { maxRecordedAt: string | null }[]
  >`SELECT MAX(recordedAt) as maxRecordedAt FROM StationStatus WHERE recordedAt > ${watermark} AND recordedAt <= ${cutoff};`;

  const nextWatermark = maxRecordedAt ? new Date(maxRecordedAt) : watermark;

  if (maxRecordedAt) {
    await setWatermark(HOURLY_WATERMARK, nextWatermark);
  }

  return {
    processedCount: Number(processedCount),
    upsertedCount: Number(upsertedCount),
    watermark: nextWatermark,
    cutoff,
  };
}
