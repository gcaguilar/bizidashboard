import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/predictions', () => ({
  estimateStationPredictions: vi.fn(() => ({
    predictions: [{ horizonMinutes: 60, predictedBikesAvailable: 15, confidence: 0.8 }],
  })),
}));

import { assessStationRisk } from '@/lib/rebalancing-prediction';

describe('rebalancing-prediction', () => {
  it('assesses risk properly based on predictions', () => {
    const risk = assessStationRisk(
      { id: '1', capacity: 20, bikesAvailable: 10, anchorsFree: 10 } as any,
      [],
      [],
      { min: 0.3, max: 0.6 },
      new Date()
    );

    expect(risk.riskFullAt1h).toBe(0.3);
    expect(risk.riskEmptyAt1h).toBe(0);
  });

  it('returns zero risk if capacity is zero', () => {
    const risk = assessStationRisk(
      { id: '1', capacity: 0, bikesAvailable: 0, anchorsFree: 0 } as any,
      [],
      [],
      { min: 0.3, max: 0.6 },
      new Date()
    );

    expect(risk.riskEmptyAt1h).toBe(0);
    expect(risk.riskFullAt1h).toBe(0);
  });
});
