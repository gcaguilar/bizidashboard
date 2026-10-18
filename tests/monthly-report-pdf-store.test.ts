import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@/generated/prisma/client';

vi.mock('@/lib/db', () => ({ prisma: {} as unknown as PrismaClient }));

import {
  deleteStoredMonthlyReportPdf,
  getStoredMonthlyReportPdf,
  hasStoredMonthlyReportPdf,
  storeMonthlyReportPdf,
} from '@/lib/monthly-report-pdf-store';

type FakeClient = {
  monthlyReportPdf: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
};

function createClient(): FakeClient {
  return {
    monthlyReportPdf: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
}

describe('monthly report pdf store', () => {
  let client: FakeClient;

  beforeEach(() => {
    client = createClient();
  });

  it('returns the stored bytes for a month', async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    client.monthlyReportPdf.findUnique.mockResolvedValue({ bytes });

    const result = await getStoredMonthlyReportPdf(
      '2026-03',
      client as unknown as PrismaClient
    );

    expect(result).toEqual(bytes);
    expect(client.monthlyReportPdf.findUnique).toHaveBeenCalledWith({
      where: { monthKey: '2026-03' },
      select: { bytes: true },
    });
  });

  it('returns null when the month has no pdf', async () => {
    client.monthlyReportPdf.findUnique.mockResolvedValue(null);

    const result = await getStoredMonthlyReportPdf(
      '2026-03',
      client as unknown as PrismaClient
    );

    expect(result).toBeNull();
  });

  it('reports whether a month has a pdf', async () => {
    client.monthlyReportPdf.findUnique.mockResolvedValue({ monthKey: '2026-03' });

    await expect(
      hasStoredMonthlyReportPdf('2026-03', client as unknown as PrismaClient)
    ).resolves.toBe(true);
  });

  it('upserts the bytes and the size', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);

    await storeMonthlyReportPdf('2026-03', bytes, client as unknown as PrismaClient);

    expect(client.monthlyReportPdf.upsert).toHaveBeenCalledWith({
      where: { monthKey: '2026-03' },
      create: { monthKey: '2026-03', bytes: Buffer.from(bytes), byteSize: 5 },
      update: { bytes: Buffer.from(bytes), byteSize: 5 },
    });
  });

  it('deletes the pdf of a month', async () => {
    await deleteStoredMonthlyReportPdf('2026-03', client as unknown as PrismaClient);

    expect(client.monthlyReportPdf.deleteMany).toHaveBeenCalledWith({
      where: { monthKey: '2026-03' },
    });
  });
});
