import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { executeRawMock, transactionMock } = vi.hoisted(() => ({
  executeRawMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    $executeRaw: executeRawMock,
    $transaction: transactionMock,
    $executeRawUnsafe: vi.fn(),
  },
}));

vi.mock('@/analytics/watermarks', () => ({
  getWatermark: vi.fn().mockResolvedValue(new Date(0)),
  setWatermark: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { runRetentionCleanup } from '@/analytics/retention';

describe('runRetentionCleanup', () => {
  beforeEach(() => {
    executeRawMock.mockReset();
    transactionMock.mockReset();
  });

  it('deletes raw snapshots in committed batches without a long transaction', async () => {
    executeRawMock
      .mockResolvedValueOnce(20_000)
      .mockResolvedValueOnce(20_000)
      .mockResolvedValueOnce(5_000)
      .mockResolvedValueOnce(50_000)
      .mockResolvedValueOnce(1_000)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(300)
      .mockResolvedValueOnce(40);

    const result = await runRetentionCleanup();

    expect(result).toEqual({
      stationStatusDeleted: 45_000,
      hourlyStatsDeleted: 51_000,
      stationAlertsDeleted: 10,
      stationRankingsDeleted: 5,
      collectionRunsDeleted: 300,
      securityEventsDeleted: 40,
    });
    expect(transactionMock).not.toHaveBeenCalled();
    expect(executeRawMock).toHaveBeenCalledTimes(9);
  });

  it('stops after the first empty raw batch', async () => {
    executeRawMock
      .mockResolvedValue(0);

    const result = await runRetentionCleanup();

    expect(result.stationStatusDeleted).toBe(0);
    expect(result.hourlyStatsDeleted).toBe(0);
    // Un lote crudo, uno horario, alertas, rankings, CollectionRun y SecurityEvent.
    expect(executeRawMock).toHaveBeenCalledTimes(6);
  });
});
