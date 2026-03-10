import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchTransitAlertsMock } = vi.hoisted(() => ({
  fetchTransitAlertsMock: vi.fn(),
}));

vi.mock('@/lib/transit-api', () => ({
  fetchTransitAlerts: fetchTransitAlertsMock,
}));

import { GET } from '@/app/api/transit/alerts/route';

describe('GET /api/transit/alerts', () => {
  beforeEach(() => {
    fetchTransitAlertsMock.mockReset();
  });

  it('returns alerts payload', async () => {
    fetchTransitAlertsMock.mockResolvedValue({
      mode: 'tram',
      limit: 10,
      alerts: [],
      generatedAt: '2026-03-10T00:00:00.000Z',
    });

    const response = await GET(new Request('http://localhost/api/transit/alerts?mode=tram&limit=10') as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetchTransitAlertsMock).toHaveBeenCalledWith('tram', 10);
    expect(payload.mode).toBe('tram');
  });

  it('returns 400 when limit is invalid', async () => {
    const response = await GET(new Request('http://localhost/api/transit/alerts?mode=bus&limit=0') as never);
    expect(response.status).toBe(400);
  });
});
