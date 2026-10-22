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

  it.each([
    ['pattern', runPatternRollup, 'pattern_rollup', '"StationPattern"'],
    ['heatmap', runHeatmapRollup, 'heatmap_rollup', '"StationHeatmapCell"'],
  ] as const)('aggregates the %s rollup in a single weighted INSERT ... SELECT', async (_name, run, watermarkKey, table) => {
    executeRawMock.mockResolvedValue(42);

    const result = await run(cutoff);

    expect(queryRawMock).not.toHaveBeenCalled();
    expect(executeRawMock).toHaveBeenCalledTimes(1);
    const sql = (executeRawMock.mock.calls[0][0] as { sql: string }).sql;
    expect(sql).toContain(`INSERT INTO ${table}`);
    expect(sql).toContain('SUM("bikesAvg" * "sampleCount") / NULLIF(SUM("sampleCount"), 0)');
    expect(sql).toContain('GROUP BY 1, 2, 3');
    expect(result.upsertedCount).toBe(42);
    expect(setWatermarkMock).toHaveBeenCalledWith(watermarkKey, cutoff);
  });

  it.each([
    ['pattern', runPatternRollup],
    ['heatmap', runHeatmapRollup],
  ] as const)('skips the %s rollup when the watermark already covers the cutoff', async (_name, run) => {
    getWatermarkMock.mockResolvedValue(cutoff);

    const result = await run(cutoff);

    expect(executeRawMock).not.toHaveBeenCalled();
    expect(result.upsertedCount).toBe(0);
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

    expect(executeRawMock).toHaveBeenCalledTimes(chunkRowsForBulkQuery(new Array(expectedAlertCount), 7).length);
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
