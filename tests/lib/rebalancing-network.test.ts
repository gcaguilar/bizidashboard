import { describe, expect, it } from 'vitest';
import { buildNetworkContext } from '@/lib/rebalancing-network';

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
        '2': { pctTimeEmpty: 0.1, pctTimeFull: 0.1 } as any,
        '3': { pctTimeEmpty: 0.1, pctTimeFull: 0.1 } as any,
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
        '2': { pctTimeEmpty: 0.5, pctTimeFull: 0.5 } as any,
      }
    );

    expect(network.urgencyAdjustment).toBe(1.0);
  });
});
