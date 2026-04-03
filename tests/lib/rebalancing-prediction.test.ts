import { describe, expect, it, vi } from 'vitest';
import type { StationSnapshot } from '@/lib/api';

vi.mock('@/lib/predictions', () => ({
  estimateStationPredictions: vi.fn(() => ({
    predictions: [{ horizonMinutes: 60, predictedBikesAvailable: 15, confidence: 0.8 }],
  })),
}));

import { assessStationRisk } from '@/lib/rebalancing-prediction';

describe('rebalancing-prediction', () => {
  it('assesses risk properly based on predictions', () => {
    const station = {
      id: '1',
      name: 'S1',
      bikesAvailable: 10,
      anchorsFree: 10,
      capacity: 20,
      lat: 0,
      lon: 0,
      recordedAt: new Date().toISOString(),
    } satisfies StationSnapshot;

    const risk = assessStationRisk(
      station,
      [],
      [],
      { min: 0.3, max: 0.6 },
      new Date()
    );

    expect(risk.riskFullAt1h).toBe(0.3);
    expect(risk.riskEmptyAt1h).toBe(0);
  });

  it('returns zero risk if capacity is zero', () => {
    const station = {
      id: '1',
      name: 'S1',
      bikesAvailable: 0,
      anchorsFree: 0,
      capacity: 0,
      lat: 0,
      lon: 0,
      recordedAt: new Date().toISOString(),
    } satisfies StationSnapshot;

    const risk = assessStationRisk(
      station,
      [],
      [],
      { min: 0.3, max: 0.6 },
      new Date()
    );

    expect(risk.riskEmptyAt1h).toBe(0);
    expect(risk.riskFullAt1h).toBe(0);
  });
});
