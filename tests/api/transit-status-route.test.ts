import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchTransitStatusMock } = vi.hoisted(() => ({
  fetchTransitStatusMock: vi.fn(),
}));

vi.mock('@/lib/transit-api', () => ({
  fetchTransitStatus: fetchTransitStatusMock,
}));

import { GET } from '@/app/api/transit/status/route';

describe('GET /api/transit/status', () => {
  beforeEach(() => {
    fetchTransitStatusMock.mockReset();
  });

  it('returns transit status payload', async () => {
    fetchTransitStatusMock.mockResolvedValue({
      mode: 'bus',
      activeStops: 100,
      stopsWithRecentSnapshot: 80,
      snapshotsLast24Hours: 3000,
      staleSnapshotsLast24Hours: 200,
      lastSnapshotAt: '2026-03-10T00:00:00.000Z',
      generatedAt: '2026-03-10T00:05:00.000Z',
    });

    const response = await GET(new Request('http://localhost/api/transit/status?mode=bus') as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetchTransitStatusMock).toHaveBeenCalledWith('bus');
    expect(payload.activeStops).toBe(100);
  });

  it('returns 400 when mode is missing', async () => {
    const response = await GET(new Request('http://localhost/api/transit/status') as never);
    expect(response.status).toBe(400);
  });
});
