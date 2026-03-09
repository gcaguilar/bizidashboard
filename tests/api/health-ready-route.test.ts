import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryRawMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: queryRawMock,
  },
}));

import { GET } from '@/app/api/health/ready/route';

describe('GET /api/health/ready', () => {
  beforeEach(() => {
    queryRawMock.mockReset();
  });

  it('returns 200 when database is reachable', async () => {
    queryRawMock.mockResolvedValue([{ value: 1 }]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(payload.status).toBe('ok');
    expect(payload.ready).toBe(true);
    expect(payload.checks.database).toBe('ok');
    expect(queryRawMock).toHaveBeenCalledTimes(1);
  });

  it('returns 503 when database is not reachable', async () => {
    queryRawMock.mockRejectedValue(new Error('db down'));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(payload.status).toBe('degraded');
    expect(payload.ready).toBe(false);
    expect(payload.checks.database).toBe('down');
  });
});
