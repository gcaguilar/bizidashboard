import { describe, expect, it } from 'vitest';
import { classifyStation } from '@/lib/station-classifier';
import type { StationBaseMetrics, TimeBandMetrics, TargetBand } from '@/types/rebalancing';

const defaultMetrics: StationBaseMetrics = {
  occupancyAvg: 0.5,
  pctTimeEmpty: 0,
  pctTimeFull: 0,
  rotation: 100,
  rotationPerBike: 5,
  persistenceProxy: 0,
  criticalEpisodeAvgMinutes: 0,
  netImbalance: 0,
  variability: 0.1,
  unsatisfiedDemandProxy: 0,
};

const defaultTargetBand: TargetBand = { min: 0.3, max: 0.7 };

describe('station-classifier', () => {
  it('classifies as data_review if capacity is inconsistent', () => {
    const { classification } = classifyStation(
      20,
      10,
      5,
      defaultMetrics,
      [],
      defaultTargetBand,
      { '1': defaultMetrics }
    );
    expect(classification).toBe('data_review');
  });

  it('classifies as overstock when rules met', () => {
    const { classification } = classifyStation(
      20,
      15,
      5,
      { ...defaultMetrics, occupancyAvg: 0.8, rotationPerBike: 1, persistenceProxy: 0.5 },
      [],
      defaultTargetBand,
      { '1': { ...defaultMetrics, rotationPerBike: 10 } }
    );
    expect(classification).toBe('overstock');
  });

  it('classifies as deficit when rules met', () => {
    const timeBands: TimeBandMetrics[] = [
      {
        ...defaultMetrics,
        timeBand: 'morning_peak',
        dayCategory: 'weekday',
        pctTimeEmpty: 0.15,
      },
    ];
    const { classification } = classifyStation(
      20,
      2,
      18,
      { ...defaultMetrics, occupancyAvg: 0.2 },
      timeBands,
      defaultTargetBand,
      { '1': defaultMetrics }
    );
    expect(classification).toBe('deficit');
  });

  it('classifies as balanced by default', () => {
    const { classification } = classifyStation(
      20,
      10,
      10,
      defaultMetrics,
      [],
      defaultTargetBand,
      { '1': defaultMetrics }
    );
    expect(classification).toBe('balanced');
  });
});
