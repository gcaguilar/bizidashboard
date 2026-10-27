import { describe, expect, it } from 'vitest';
import {
  buildStationDistrictComparison,
  type StationComparisonMetrics,
} from '@/lib/station-district-comparison';

const m = (partial: Partial<StationComparisonMetrics>): StationComparisonMetrics => ({
  occupancy: null,
  emptyShare: null,
  fullShare: null,
  movement: null,
  ...partial,
});

describe('buildStationDistrictComparison', () => {
  it('compares against the average of peers', () => {
    const result = buildStationDistrictComparison(
      m({ occupancy: 0.8, emptyShare: 0.1, movement: 100 }),
      [m({ occupancy: 0.4, emptyShare: 0.1, movement: 100 }), m({ occupancy: 0.6, emptyShare: 0.1, movement: 100 })]
    );
    expect(result.state).toBe('ok');
    const byKey = Object.fromEntries(result.rows.map((r) => [r.key, r]));
    expect(byKey.occupancy.districtValue).toBeCloseTo(0.5);
    expect(byKey.occupancy.verdict).toBe('above');
    expect(byKey.emptyShare.verdict).toBe('similar');
    expect(byKey.movement.verdict).toBe('similar');
    expect(byKey.fullShare).toBeUndefined();
  });

  it('degrades to empty with too few peers or no station data', () => {
    expect(buildStationDistrictComparison(m({ occupancy: 0.5 }), [m({ occupancy: 0.4 })]).state).toBe('empty');
    expect(buildStationDistrictComparison(m({}), [m({ occupancy: 0.4 }), m({ occupancy: 0.4 })]).state).toBe('empty');
  });

  it('marks lower values as below', () => {
    const result = buildStationDistrictComparison(m({ movement: 10 }), [m({ movement: 100 }), m({ movement: 120 })]);
    expect(result.rows[0].verdict).toBe('below');
  });
});
