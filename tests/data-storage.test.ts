import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  findManyMock,
  createManyMock,
  captureExceptionWithContextMock,
  captureWarningWithContextMock,
} = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  createManyMock: vi.fn(),
  captureExceptionWithContextMock: vi.fn(),
  captureWarningWithContextMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    station: {
      findMany: findManyMock,
    },
    stationStatus: {
      createMany: createManyMock,
    },
  },
}));

vi.mock('@/lib/sentry-reporting', () => ({
  captureExceptionWithContext: captureExceptionWithContextMock,
  captureWarningWithContext: captureWarningWithContextMock,
}));

import { storeStationStatuses } from '@/services/data-storage';

describe('storeStationStatuses', () => {
  beforeEach(() => {
    findManyMock.mockReset();
    createManyMock.mockReset();
    captureExceptionWithContextMock.mockReset();
    captureWarningWithContextMock.mockReset();
  });

  it('skips statuses whose stations are still missing after metadata refresh', async () => {
    findManyMock.mockResolvedValue([{ id: '1' }]);
    createManyMock.mockResolvedValue({ count: 1 });

    const result = await storeStationStatuses([
      {
        station_id: '1',
        num_bikes_available: 7,
        num_docks_available: 11,
        recorded_at: 1773912900,
      },
      {
        station_id: '2',
        num_bikes_available: 3,
        num_docks_available: 9,
        recorded_at: 1773912900,
      },
    ]);

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(result.duplicateCount).toBe(0);
    expect(result.skippedMissingStationIds).toEqual(['2']);
    expect(createManyMock).toHaveBeenCalledWith({
      data: [
        {
          stationId: '1',
          bikesAvailable: 7,
          anchorsFree: 11,
          recordedAt: new Date('2026-03-19T09:35:00.000Z'),
        },
      ],
      skipDuplicates: true,
    });
    expect(captureWarningWithContextMock).toHaveBeenCalledWith(
      'Station status rows skipped because station metadata is unavailable.',
      expect.objectContaining({
        area: 'services.data-storage',
        operation: 'storeStationStatuses',
      })
    );
  });

  it('returns cleanly when every status references a missing station', async () => {
    findManyMock.mockResolvedValue([]);

    const result = await storeStationStatuses([
      {
        station_id: '2',
        num_bikes_available: 3,
        num_docks_available: 9,
        recorded_at: 1773912900,
      },
    ]);

    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
    expect(result.duplicateCount).toBe(0);
    expect(result.skippedMissingStationIds).toEqual(['2']);
    expect(createManyMock).not.toHaveBeenCalled();
    expect(captureExceptionWithContextMock).not.toHaveBeenCalled();
  });
});
