import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getStationPredictionsMock } = vi.hoisted(() => ({
  getStationPredictionsMock: vi.fn(),
}));

vi.mock('@/lib/predictions', () => ({
  getStationPredictions: getStationPredictionsMock,
}));

import { GET } from '@/app/api/predictions/route';

describe('GET /api/predictions', () => {
  beforeEach(() => {
    getStationPredictionsMock.mockReset();
  });

  it('returns 400 without stationId', async () => {
    const response = await GET(new Request('http://localhost/api/predictions') as never);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('stationId is required');
    expect(getStationPredictionsMock).not.toHaveBeenCalled();
  });

  it('returns predictions payload for known station', async () => {
    getStationPredictionsMock.mockResolvedValue({
      stationId: '101',
      generatedAt: '2026-03-12T12:00:00.000Z',
      modelVersion: 'historical-baseline-v1',
      predictions: [
        {
          horizonMinutes: 30,
          predictedBikesAvailable: 12,
          predictedAnchorsFree: 8,
          confidence: 0.76,
        },
        {
          horizonMinutes: 60,
          predictedBikesAvailable: 10,
          predictedAnchorsFree: 10,
          confidence: 0.71,
        },
      ],
    });

    const response = await GET(new Request('http://localhost/api/predictions?stationId=101') as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getStationPredictionsMock).toHaveBeenCalledWith('101');
    expect(payload.modelVersion).toBe('historical-baseline-v1');
    expect(payload.predictions[0].predictedBikesAvailable).toBe(12);
  });

  it('returns 404 when station does not exist', async () => {
    getStationPredictionsMock.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/predictions?stationId=999') as never);
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error).toBe('station not found');
  });

  it('returns 500 when prediction generation fails', async () => {
    getStationPredictionsMock.mockRejectedValue(new Error('db unavailable'));

    const response = await GET(new Request('http://localhost/api/predictions?stationId=101') as never);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('Failed to generate predictions');
  });
});
