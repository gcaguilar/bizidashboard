import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getStationPatternsMock,
  getStationWithLatestStatusMock,
  withCacheMock,
} = vi.hoisted(() => ({
  getStationPatternsMock: vi.fn(),
  getStationWithLatestStatusMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/analytics/queries/read', () => ({
  getStationPatterns: getStationPatternsMock,
  getStationWithLatestStatus: getStationWithLatestStatusMock,
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

import {
  estimateStationPredictions,
  getEmptyStationPredictions,
  getStationPredictions,
} from '@/lib/predictions';

describe('predictions model', () => {
  beforeEach(() => {
    getStationPatternsMock.mockReset();
    getStationWithLatestStatusMock.mockReset();
    withCacheMock.mockReset();
    withCacheMock.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()
    );
  });

  it('returns empty scaffold when no historical patterns exist', () => {
    const payload = getEmptyStationPredictions('101');

    expect(payload.stationId).toBe('101');
    expect(payload.modelVersion).toBeNull();
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

  it('estimates bounded future occupancy from current state and hourly patterns', () => {
    const payload = estimateStationPredictions(
      {
        stationId: '101',
        capacity: 20,
        bikesAvailable: 10,
        anchorsFree: 10,
        patterns: [
          {
            dayType: 'WEEKDAY',
            hour: 10,
            bikesAvg: 10,
            anchorsAvg: 10,
            occupancyAvg: 0.5,
            sampleCount: 24,
          },
          {
            dayType: 'WEEKDAY',
            hour: 11,
            bikesAvg: 8,
            anchorsAvg: 12,
            occupancyAvg: 0.4,
            sampleCount: 32,
          },
          {
            dayType: 'WEEKDAY',
            hour: 12,
            bikesAvg: 6,
            anchorsAvg: 14,
            occupancyAvg: 0.3,
            sampleCount: 28,
          },
        ],
      },
      new Date('2026-03-12T09:20:00.000Z')
    );

    expect(payload.modelVersion).toBe('historical-baseline-v1');
    expect(payload.predictions).toHaveLength(2);
    expect(payload.predictions[0]).toEqual({
      horizonMinutes: 30,
      predictedBikesAvailable: 10,
      predictedAnchorsFree: 10,
      confidence: 0.62,
    });
    expect(payload.predictions[1]).toEqual({
      horizonMinutes: 60,
      predictedBikesAvailable: 9,
      predictedAnchorsFree: 11,
      confidence: 0.65,
    });
  });

  it('queries a single station and serves the live call from cache', async () => {
    getStationWithLatestStatusMock.mockResolvedValue({
      id: '101',
      name: 'Estación prueba',
      lat: 41.65,
      lon: -0.88,
      capacity: 20,
      bikesAvailable: 10,
      anchorsFree: 10,
      recordedAt: '2026-03-12T09:00:00.000Z',
    });
    getStationPatternsMock.mockResolvedValue([
      {
        dayType: 'WEEKDAY',
        hour: 10,
        bikesAvg: 10,
        anchorsAvg: 10,
        occupancyAvg: 0.5,
        sampleCount: 24,
      },
    ]);

    const payload = await getStationPredictions('101');

    expect(withCacheMock).toHaveBeenCalledWith(
      'predictions:stationId=101',
      60,
      expect.any(Function)
    );
    // Una sola estación, no la red completa.
    expect(getStationWithLatestStatusMock).toHaveBeenCalledWith('101');
    expect(getStationPatternsMock).toHaveBeenCalledWith('101');
    expect(payload?.modelVersion).toBe('historical-baseline-v1');
  });

  it('returns null for an unknown station without touching the cache', async () => {
    getStationWithLatestStatusMock.mockResolvedValue(null);
    getStationPatternsMock.mockResolvedValue([]);

    await expect(getStationPredictions('unknown')).resolves.toBeNull();
    expect(withCacheMock).not.toHaveBeenCalled();
    expect(getStationPatternsMock).not.toHaveBeenCalled();
  });

  it('skips the cache when an explicit now is provided', async () => {
    getStationWithLatestStatusMock.mockResolvedValue({
      id: '101',
      name: 'Estación prueba',
      lat: 41.65,
      lon: -0.88,
      capacity: 20,
      bikesAvailable: 10,
      anchorsFree: 10,
      recordedAt: '2026-03-12T09:00:00.000Z',
    });
    getStationPatternsMock.mockResolvedValue([]);

    const payload = await getStationPredictions('101', new Date('2026-03-12T09:20:00.000Z'));

    expect(payload).not.toBeNull();
    expect(withCacheMock).not.toHaveBeenCalled();
  });
});
