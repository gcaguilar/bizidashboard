import { describe, expect, it } from 'vitest';
import {
  buildMobilitySearchParams,
  normalizeMobilityPreviewData,
} from '@/app/dashboard/_components/mobility-api';

describe('mobility api helper', () => {
  it('builds canonical mobility query params', () => {
    const params = buildMobilitySearchParams({
      mobilityDays: 30,
      demandDays: 30,
      month: '2026-05',
    });

    expect(params.toString()).toBe('mobilityDays=30&demandDays=30&month=2026-05');
  });

  it('drops invalid month keys and normalizes preview arrays from a flexible payload', () => {
    const params = buildMobilitySearchParams({
      mobilityDays: 14,
      demandDays: 30,
      month: '2026-5',
    });

    expect(params.toString()).toBe('mobilityDays=14&demandDays=30');

    const preview = normalizeMobilityPreviewData({
      methodology: 'demo',
      hourlySignals: [
        { stationId: '1', hour: 8, departures: 4, arrivals: 2, sampleCount: 10 },
        { stationId: '2', hour: '9', departures: 4, arrivals: 2, sampleCount: 10 },
      ],
      dailyDemand: [
        { day: '2026-05-01', demandScore: 0.4, avgOccupancy: 0.52, sampleCount: 24 },
        { day: '2026-05-02', demandScore: Number.NaN, avgOccupancy: 0.52, sampleCount: 24 },
      ],
      systemHourlyProfile: [
        { hour: 8, avgOccupancy: 0.44, avgBikesAvailable: 5.5, sampleCount: 12 },
        { hour: 9, avgOccupancy: 0.48, sampleCount: 12 },
      ],
    });

    expect(preview).toEqual({
      hourlySignals: [{ stationId: '1', hour: 8, departures: 4, arrivals: 2, sampleCount: 10 }],
      dailyDemand: [{ day: '2026-05-01', demandScore: 0.4, avgOccupancy: 0.52, sampleCount: 24 }],
      systemHourlyProfile: [{ hour: 8, avgOccupancy: 0.44, avgBikesAvailable: 5.5, sampleCount: 12 }],
    });

    expect(normalizeMobilityPreviewData({ methodology: 'demo' })).toEqual({
      hourlySignals: [],
      dailyDemand: [],
      systemHourlyProfile: [],
    });
  });
});
