import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DayType } from '@/analytics/types';
import { chunkRowsForBulkQuery } from '@/analytics/queries/bulk-upsert';

const {
  executeRawMock,
  getLocalBucketMock,
  getWatermarkMock,
  queryRawMock,
  setWatermarkMock,
} = vi.hoisted(() => ({
  executeRawMock: vi.fn(),
  getLocalBucketMock: vi.fn(),
  getWatermarkMock: vi.fn(),
  queryRawMock: vi.fn(),
  setWatermarkMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    $executeRaw: executeRawMock,
    $queryRaw: queryRawMock,
  },
}));

vi.mock('@/analytics/time-buckets', () => ({
  getLocalBucket: getLocalBucketMock,
}));

vi.mock('@/analytics/watermarks', () => ({
  getWatermark: getWatermarkMock,
  setWatermark: setWatermarkMock,
}));

import { runAlertRollup } from '@/analytics/queries/alerts';
import { runHeatmapRollup } from '@/analytics/queries/heatmap';
import { runPatternRollup } from '@/analytics/queries/patterns';

function buildHourlyStats(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    stationId: `station-${index}`,
    bucketStart: new Date(Date.UTC(2026, 3, 1, index % 24, 0, 0)),
    bikesAvg: 1,
    anchorsAvg: 1,
    occupancyAvg: 0.1,
    sampleCount: 1,
  }));
}

describe('analytics bulk rollups', () => {
  const cutoff = new Date('2026-04-08T15:00:00.000Z');

  beforeEach(() => {
    executeRawMock.mockReset();
    getLocalBucketMock.mockReset();
    getWatermarkMock.mockReset();
    queryRawMock.mockReset();
    setWatermarkMock.mockReset();

    executeRawMock.mockResolvedValue(1);
    getWatermarkMock.mockResolvedValue(new Date(0));
    getLocalBucketMock.mockImplementation((bucketStart: Date) => ({
      dayOfWeek: bucketStart.getUTCDay(),
      dayType: DayType.WEEKDAY,
      hour: bucketStart.getUTCHours(),
    }));
  });

  it('splits pattern upserts into bounded chunks', async () => {
    const hourlyStats = buildHourlyStats(800);
    queryRawMock.mockResolvedValue(hourlyStats);

    const result = await runPatternRollup(cutoff);

    expect(executeRawMock).toHaveBeenCalledTimes(chunkRowsForBulkQuery(hourlyStats, 7).length);
    expect(result.processedCount).toBe(hourlyStats.length);
    expect(result.upsertedCount).toBe(hourlyStats.length);
    expect(setWatermarkMock).toHaveBeenCalledWith('pattern_rollup', cutoff);
  });

  it('splits heatmap upserts into bounded chunks', async () => {
    const hourlyStats = buildHourlyStats(800);
    queryRawMock.mockResolvedValue(hourlyStats);

    const result = await runHeatmapRollup(cutoff);

    expect(executeRawMock).toHaveBeenCalledTimes(chunkRowsForBulkQuery(hourlyStats, 7).length);
    expect(result.processedCount).toBe(hourlyStats.length);
    expect(result.upsertedCount).toBe(hourlyStats.length);
    expect(setWatermarkMock).toHaveBeenCalledWith('heatmap_rollup', cutoff);
  });

  it('splits alert upserts into bounded chunks after deactivating existing alerts', async () => {
    const hourlyStats = buildHourlyStats(800).map((row) => ({
      stationId: row.stationId,
      bikesAvg: row.bikesAvg,
      anchorsAvg: row.anchorsAvg,
      sampleCount: row.sampleCount,
    }));
    queryRawMock.mockResolvedValue(hourlyStats);

    const result = await runAlertRollup(cutoff);
    const expectedAlertCount = hourlyStats.length * 2;

    expect(executeRawMock).toHaveBeenCalledTimes(1 + chunkRowsForBulkQuery(new Array(expectedAlertCount), 7).length);
    expect(result.processedCount).toBe(hourlyStats.length);
    expect(result.upsertedCount).toBe(expectedAlertCount);
    expect(setWatermarkMock).toHaveBeenCalledWith('alert-rollup', cutoff);
  });

  it('keeps each chunk under the parameter budget', () => {
    const chunks = chunkRowsForBulkQuery(buildHourlyStats(1_600), 7);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length * 7 <= 5_000)).toBe(true);
  });
});
