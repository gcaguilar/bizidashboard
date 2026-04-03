import { describe, expect, it } from 'vitest';
import { buildNetworkContext } from '@/lib/rebalancing-network';
import type { StationBaseMetrics } from '@/types/rebalancing';

const robustMetrics: StationBaseMetrics = {
  occupancyAvg: 0.5,
  pctTimeEmpty: 0.1,
  pctTimeFull: 0.1,
  rotation: 10,
  rotationPerBike: 1,
  persistenceProxy: 0.1,
  criticalEpisodeAvgMinutes: 10,
  netImbalance: 0,
  variability: 0.1,
  unsatisfiedDemandProxy: 0,
};

const weakMetrics: StationBaseMetrics = {
  ...robustMetrics,
  pctTimeEmpty: 0.5,
  pctTimeFull: 0.5,
};

describe('rebalancing-network', () => {
  it('adjusts urgency if multiple robust alternatives exist', () => {
    const network = buildNetworkContext(
      '1',
      0.5,
      [
        {
          stationId: '2',
          distanceMeters: 100,
          walkingTimeMinutes: 2,
          currentOccupancy: 0,
          historicalRobustness: 0,
        },
        {
          stationId: '3',
          distanceMeters: 200,
          walkingTimeMinutes: 3,
          currentOccupancy: 0,
          historicalRobustness: 0,
        },
      ],
      {
        '2': robustMetrics,
        '3': robustMetrics,
      }
    );

    expect(network.urgencyAdjustment).toBe(0.5);
  });

  it('keeps full urgency if no robust alternatives exist', () => {
    const network = buildNetworkContext(
      '1',
      0.5,
      [
        {
          stationId: '2',
          distanceMeters: 100,
          walkingTimeMinutes: 2,
          currentOccupancy: 0,
          historicalRobustness: 0,
        },
      ],
      {
        '2': weakMetrics,
      }
    );

    expect(network.urgencyAdjustment).toBe(1.0);
  });
});
