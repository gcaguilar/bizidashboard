import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { findUniqueMock, upsertMock, deleteManyMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  upsertMock: vi.fn(),
  deleteManyMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    monthlyReportSnapshot: {
      findUnique: findUniqueMock,
      upsert: upsertMock,
      deleteMany: deleteManyMock,
    },
  },
}));

import {
  deleteMonthlyReportSnapshot,
  readMonthlyReportSnapshot,
  writeMonthlyReportSnapshot,
} from '@/lib/monthly-report-snapshot';
import { MONTHLY_REPORT_SCHEMA_VERSION } from '@/lib/monthly-report-version';

describe('monthly report snapshot store', () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    upsertMock.mockReset();
    deleteManyMock.mockReset();
  });

  it('reads a snapshot with the current schema version', async () => {
    const payload = { monthKey: '2026-03', hasReport: true };
    findUniqueMock.mockResolvedValue({
      payload,
      schemaVersion: MONTHLY_REPORT_SCHEMA_VERSION,
    });

    await expect(readMonthlyReportSnapshot('2026-03')).resolves.toEqual(payload);
  });

  it('ignores a snapshot written by an older schema', async () => {
    findUniqueMock.mockResolvedValue({
      payload: { monthKey: '2026-03' },
      schemaVersion: MONTHLY_REPORT_SCHEMA_VERSION - 1,
    });

    await expect(readMonthlyReportSnapshot('2026-03')).resolves.toBeNull();
  });

  it('upserts the assembled report with its version', async () => {
    const report = {
      monthKey: '2026-03',
      generatedAt: '2026-04-01T00:00:00.000Z',
      hasReport: true,
    };

    await writeMonthlyReportSnapshot('2026-03', report as never);

    expect(upsertMock).toHaveBeenCalledTimes(1);
    const call = upsertMock.mock.calls[0]?.[0] as {
      where: { monthKey: string };
      create: { payload: unknown; schemaVersion: number };
    };
    expect(call.where.monthKey).toBe('2026-03');
    expect(call.create.payload).toEqual(report);
    expect(call.create.schemaVersion).toBe(MONTHLY_REPORT_SCHEMA_VERSION);
  });

  it('deletes a snapshot when a report is invalidated', async () => {
    await deleteMonthlyReportSnapshot('2026-03');

    expect(deleteManyMock).toHaveBeenCalledWith({ where: { monthKey: '2026-03' } });
  });
});
