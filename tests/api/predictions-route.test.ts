import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/predictions/route';

describe('GET /api/predictions', () => {
  it('returns 400 without stationId', async () => {
    const response = await GET(new Request('http://localhost/api/predictions') as never);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('stationId is required');
  });

  it('returns empty prediction scaffold for station', async () => {
    const response = await GET(new Request('http://localhost/api/predictions?stationId=101') as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.stationId).toBe('101');
    expect(payload.predictions).toEqual([
      {
        horizonMinutes: 30,
        predictedBikesAvailable: null,
        predictedAnchorsFree: null,
        confidence: null,
      },
      {
        horizonMinutes: 60,
        predictedBikesAvailable: null,
        predictedAnchorsFree: null,
        confidence: null,
      },
    ]);
  });
});
