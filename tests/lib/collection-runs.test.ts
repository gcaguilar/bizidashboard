import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createMock,
  updateMock,
  findManyMock,
} = vi.hoisted(() => ({
  createMock: vi.fn(),
  updateMock: vi.fn(),
  findManyMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    collectionRun: {
      create: createMock,
      update: updateMock,
      findMany: findManyMock,
    },
  },
}));

import {
  createCollectionRun,
  getRecentCollectionRuns,
  updateCollectionRun,
} from '@/lib/collection-runs';

describe('collection runs service', () => {
  beforeEach(() => {
    createMock.mockReset();
    updateMock.mockReset();
    findManyMock.mockReset();
    createMock.mockResolvedValue({});
    updateMock.mockResolvedValue({});
  });

  it('persists collection runs with operational metadata', async () => {
    await createCollectionRun({
      collectionId: 'col-1',
      requestId: 'req-1',
      city: 'zaragoza',
      trigger: 'manual',
      sourceUrl: 'https://example.com/gbfs.json',
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collectionId: 'col-1',
          requestId: 'req-1',
          city: 'zaragoza',
          trigger: 'manual',
        }),
      })
    );
  });

  it('updates collection run aggregates and serializes recent rows', async () => {
    await updateCollectionRun('col-1', {
      status: 'succeeded',
      insertedCount: 42,
      warningCount: 1,
      errorCount: 0,
      finishedAt: new Date('2026-04-02T10:00:00.000Z'),
    });

    expect(updateMock).toHaveBeenCalled();

    findManyMock.mockResolvedValue([
      {
        collectionId: 'col-1',
        trigger: 'manual',
        status: 'succeeded',
        requestId: 'req-1',
        snapshotRecordedAt: new Date('2026-04-02T09:55:00.000Z'),
        insertedCount: 42,
        duplicateCount: 0,
        warningCount: 1,
        errorCount: 0,
        startedAt: new Date('2026-04-02T09:54:00.000Z'),
        finishedAt: new Date('2026-04-02T10:00:00.000Z'),
      },
    ]);

    const rows = await getRecentCollectionRuns();

    expect(rows[0]?.collectionId).toBe('col-1');
    expect(rows[0]?.snapshotRecordedAt).toBe('2026-04-02T09:55:00.000Z');
  });
});

