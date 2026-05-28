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

  it('drops invalid month keys and normalizes preview arrays', () => {
    const params = buildMobilitySearchParams({
      mobilityDays: 14,
      demandDays: 30,
      month: '2026-5',
    });

    expect(params.toString()).toBe('mobilityDays=14&demandDays=30');

    expect(
      normalizeMobilityPreviewData({
        methodology: 'demo',
      })
    ).toEqual({
      hourlySignals: [],
      dailyDemand: [],
      systemHourlyProfile: [],
    });
  });
});
