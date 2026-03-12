import { describe, expect, it, vi } from 'vitest';

vi.mock('@/analytics/queries/read', () => ({
  getStationPatterns: vi.fn(),
  getStationsWithLatestStatus: vi.fn(),
}));

import { estimateStationPredictions, getEmptyStationPredictions } from '@/lib/predictions';

describe('predictions model', () => {
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
});
