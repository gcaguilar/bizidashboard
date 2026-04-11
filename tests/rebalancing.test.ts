import { describe, expect, it } from 'vitest';
import { inferStationType } from '@/lib/station-typology';
import {
  getTargetBand,
  isWithinBand,
  bandDeviation,
} from '@/lib/target-bands';
import { classifyStation } from '@/lib/station-classifier';
import {
  decideAction,
} from '@/lib/rebalancing-engine';
import { buildNetworkContext } from '@/lib/rebalancing-network';
import { computeTransfers } from '@/lib/rebalancing-matching';
import { computeReportKPIs, computeBaselineComparison } from '@/lib/rebalancing-impact';
import type {
  StationBaseMetrics,
  TimeBandMetrics,
  RiskAssessment,
  NetworkContext,
  StationDiagnostic,
  NearbyStation,
} from '@/types/rebalancing';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeBaseMetrics(overrides: Partial<StationBaseMetrics> = {}): StationBaseMetrics {
  return {
    occupancyAvg: 0.50,
    pctTimeEmpty: 0.05,
    pctTimeFull: 0.05,
    rotation: 100,
    rotationPerBike: 10,
    persistenceProxy: 0.20,
    criticalEpisodeAvgMinutes: 15,
    netImbalance: 0,
    variability: 0.10,
    unsatisfiedDemandProxy: 2,
    ...overrides,
  };
}

function makeTimeBandMetrics(overrides: Partial<TimeBandMetrics>[] = []): TimeBandMetrics[] {
  const base = [
    { timeBand: 'morning_peak' as const, dayCategory: 'weekday' as const },
    { timeBand: 'valley' as const, dayCategory: 'weekday' as const },
    { timeBand: 'evening_peak' as const, dayCategory: 'weekday' as const },
    { timeBand: 'night' as const, dayCategory: 'weekday' as const },
  ].map((b) => ({ ...makeBaseMetrics(), ...b }));

  return base.map((row, i) => ({ ...row, ...(overrides[i] ?? {}) }));
}

function makeRisk(overrides: Partial<RiskAssessment> = {}): RiskAssessment {
  return {
    riskEmptyAt1h: 0.1,
    riskEmptyAt3h: 0.1,
    riskFullAt1h: 0.1,
    riskFullAt3h: 0.1,
    demandNextHour: 5,
    demandNext3Hours: 12,
    selfCorrectionProbability: 0.3,
    estimatedRecoveryMinutes: null,
    confidence: 0.65,
    ...overrides,
  };
}

function makeNetwork(overrides: Partial<NetworkContext> = {}): NetworkContext {
  return {
    nearbyStations: [],
    clusterCapacity: 0,
    clusterAvailability: 0,
    urgencyAdjustment: 1.0,
    ...overrides,
  };
}

function makeNearbyStation(overrides: Partial<NearbyStation> = {}): NearbyStation {
  return {
    stationId: 'neighbor-1',
    distanceMeters: 200,
    walkingTimeMinutes: 3,
    currentOccupancy: 0.50,
    historicalRobustness: 0.70,
    ...overrides,
  };
}

// ─── Station typology inference ───────────────────────────────────────────────

describe('inferStationType', () => {
  it('returns mixed with no patterns', () => {
    const result = inferStationType([]);
    expect(result.type).toBe('mixed');
    expect(result.confidence).toBe(0);
  });

  it('infers residential when morning occupancy < evening occupancy', () => {
    const patterns = [
      // Morning: low occupancy (bikes have gone)
      { dayType: 'WEEKDAY', hour: 7, occupancyAvg: 0.20, sampleCount: 20 },
      { dayType: 'WEEKDAY', hour: 8, occupancyAvg: 0.22, sampleCount: 20 },
      { dayType: 'WEEKDAY', hour: 9, occupancyAvg: 0.21, sampleCount: 20 },
      // Evening: high occupancy (bikes returned)
      { dayType: 'WEEKDAY', hour: 17, occupancyAvg: 0.60, sampleCount: 20 },
      { dayType: 'WEEKDAY', hour: 18, occupancyAvg: 0.65, sampleCount: 20 },
      { dayType: 'WEEKDAY', hour: 19, occupancyAvg: 0.62, sampleCount: 20 },
      // Valley
      { dayType: 'WEEKDAY', hour: 12, occupancyAvg: 0.40, sampleCount: 20 },
    ];
    const result = inferStationType(patterns);
    expect(result.type).toBe('residential');
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it('infers offices when morning occupancy > evening occupancy', () => {
    const patterns = [
      { dayType: 'WEEKDAY', hour: 7, occupancyAvg: 0.72, sampleCount: 20 },
      { dayType: 'WEEKDAY', hour: 8, occupancyAvg: 0.75, sampleCount: 20 },
      { dayType: 'WEEKDAY', hour: 9, occupancyAvg: 0.71, sampleCount: 20 },
      { dayType: 'WEEKDAY', hour: 17, occupancyAvg: 0.28, sampleCount: 20 },
      { dayType: 'WEEKDAY', hour: 18, occupancyAvg: 0.25, sampleCount: 20 },
      { dayType: 'WEEKDAY', hour: 19, occupancyAvg: 0.30, sampleCount: 20 },
      { dayType: 'WEEKDAY', hour: 12, occupancyAvg: 0.50, sampleCount: 20 },
    ];
    const result = inferStationType(patterns);
    expect(result.type).toBe('offices');
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it('infers tourist when weekend activity is much higher than weekday', () => {
    const patterns = [];
    for (let h = 0; h < 24; h++) {
      patterns.push({ dayType: 'WEEKDAY', hour: h, occupancyAvg: 0.3, sampleCount: 5 });
      patterns.push({ dayType: 'WEEKEND', hour: h, occupancyAvg: 0.3, sampleCount: 10 }); // 2x weekday
    }
    const result = inferStationType(patterns);
    expect(result.type).toBe('tourist');
  });

  it('infers leisure when night fraction is high', () => {
    const patterns = [];
    for (let h = 0; h < 24; h++) {
      const isNight = h >= 21 || h <= 2;
      patterns.push({
        dayType: 'WEEKDAY',
        hour: h,
        occupancyAvg: isNight ? 0.7 : 0.2,
        sampleCount: isNight ? 20 : 5, // heavy night activity
      });
    }
    const result = inferStationType(patterns);
    expect(result.type).toBe('leisure');
  });
});

// ─── Target bands ────────────────────────────────────────────────────────────

describe('getTargetBand', () => {
  it('returns correct band for residential morning_peak', () => {
    const band = getTargetBand('residential', 'morning_peak');
    expect(band.min).toBe(0.25);
    expect(band.max).toBe(0.55);
  });

  it('returns mixed band as fallback for unknown type', () => {
    const band = getTargetBand('mixed', 'valley');
    expect(band.min).toBeGreaterThanOrEqual(0);
    expect(band.max).toBeLessThanOrEqual(1);
  });
});

describe('isWithinBand', () => {
  it('returns true when occupancy is within band', () => {
    expect(isWithinBand(0.5, { min: 0.3, max: 0.7 })).toBe(true);
  });

  it('returns false when occupancy is below band minimum', () => {
    expect(isWithinBand(0.1, { min: 0.3, max: 0.7 })).toBe(false);
  });

  it('returns false when occupancy is above band maximum', () => {
    expect(isWithinBand(0.9, { min: 0.3, max: 0.7 })).toBe(false);
  });

  it('returns true at exact boundary values', () => {
    expect(isWithinBand(0.3, { min: 0.3, max: 0.7 })).toBe(true);
    expect(isWithinBand(0.7, { min: 0.3, max: 0.7 })).toBe(true);
  });
});

describe('bandDeviation', () => {
  it('returns 0 when within band', () => {
    expect(bandDeviation(0.5, { min: 0.3, max: 0.7 })).toBe(0);
  });

  it('returns negative when below band', () => {
    const dev = bandDeviation(0.1, { min: 0.3, max: 0.7 });
    expect(dev).toBe(0.1 - 0.3); // -0.2
    expect(dev).toBeLessThan(0);
  });

  it('returns positive when above band', () => {
    const dev = bandDeviation(0.9, { min: 0.3, max: 0.7 });
    expect(dev).toBeCloseTo(0.9 - 0.7); // 0.2
    expect(dev).toBeGreaterThan(0);
  });
});

// ─── Station classifier ───────────────────────────────────────────────────────

describe('classifyStation', () => {
  const targetBand = { min: 0.30, max: 0.65 };

  it('classifies balanced station correctly', () => {
    const result = classifyStation(makeBaseMetrics(), makeTimeBandMetrics(), targetBand, 50);
    expect(result.classification).toBe('balanced');
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('classifies overstock when occupancy high, rotation low, persistence high', () => {
    const result = classifyStation(
      makeBaseMetrics({ occupancyAvg: 0.82, persistenceProxy: 0.55 }),
      makeTimeBandMetrics(),
      targetBand,
      25 // low rotation percentile
    );
    expect(result.classification).toBe('overstock');
  });

  it('classifies deficit when occupancy low and peak empty time high', () => {
    const timeBandMetrics = makeTimeBandMetrics([
      { pctTimeEmpty: 0.25 }, // morning_peak: very empty
    ]);
    const result = classifyStation(
      makeBaseMetrics({ occupancyAvg: 0.22 }),
      timeBandMetrics,
      targetBand,
      60
    );
    expect(result.classification).toBe('deficit');
  });

  it('classifies peak_saturation when peak full but off-peak normal', () => {
    const timeBandMetrics = makeTimeBandMetrics([
      { pctTimeFull: 0.30, pctTimeEmpty: 0.01 }, // morning_peak full
      { pctTimeFull: 0.02, pctTimeEmpty: 0.02 }, // valley normal
      { pctTimeFull: 0.03, pctTimeEmpty: 0.02 }, // evening_peak normal
      { pctTimeFull: 0.01, pctTimeEmpty: 0.01 }, // night normal
    ]);
    const result = classifyStation(
      makeBaseMetrics({ occupancyAvg: 0.50 }),
      timeBandMetrics,
      targetBand,
      50
    );
    expect(result.classification).toBe('peak_saturation');
  });

  it('classifies peak_emptying when peak empty but off-peak normal', () => {
    const timeBandMetrics = makeTimeBandMetrics([
      { pctTimeEmpty: 0.35, pctTimeFull: 0.01 }, // morning_peak empty
      { pctTimeEmpty: 0.02, pctTimeFull: 0.02 }, // valley normal
      { pctTimeEmpty: 0.03, pctTimeFull: 0.02 }, // evening_peak normal
      { pctTimeEmpty: 0.01, pctTimeFull: 0.01 }, // night normal
    ]);
    const result = classifyStation(
      makeBaseMetrics({ occupancyAvg: 0.40 }),
      timeBandMetrics,
      targetBand,
      50
    );
    expect(result.classification).toBe('peak_emptying');
  });

  it('classifies data_review for frozen sensor', () => {
    const result = classifyStation(
      makeBaseMetrics({ variability: 0.005, persistenceProxy: 0.10 }),
      makeTimeBandMetrics(),
      targetBand,
      75 // high rotation percentile with frozen sensor
    );
    expect(result.classification).toBe('data_review');
  });

  it('always provides reasons', () => {
    const result = classifyStation(makeBaseMetrics(), makeTimeBandMetrics(), targetBand, 50);
    expect(result.reasons).toBeInstanceOf(Array);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

// ─── Decision engine ─────────────────────────────────────────────────────────

describe('decideAction', () => {
  const targetBand = { min: 0.30, max: 0.65 };

  it('returns review for data_review classification', () => {
    const result = decideAction(
      'data_review', 0.5, targetBand, 'morning_peak',
      makeRisk(), makeNetwork(), 100
    );
    expect(result.actionGroup).toBe('review');
    expect(result.urgency).toBe('none');
  });

  it('returns stable when self-correction is fast and likely', () => {
    const result = decideAction(
      'balanced', 0.4, targetBand, 'morning_peak',
      makeRisk({ selfCorrectionProbability: 0.85, estimatedRecoveryMinutes: 30 }),
      makeNetwork(), 100
    );
    expect(result.actionGroup).toBe('stable');
  });

  it('returns donor when above band maximum', () => {
    const result = decideAction(
      'overstock', 0.90, targetBand, 'morning_peak',
      makeRisk({ riskFullAt1h: 0.70 }), makeNetwork(), 100
    );
    expect(result.actionGroup).toBe('donor');
    expect(['critical', 'high', 'medium'].includes(result.urgency)).toBe(true);
  });

  it('returns receptor when below band minimum with high empty risk', () => {
    const result = decideAction(
      'deficit', 0.15, targetBand, 'morning_peak',
      makeRisk({ riskEmptyAt1h: 0.75 }), makeNetwork(), 100
    );
    expect(result.actionGroup).toBe('receptor');
    expect(['critical', 'high', 'medium'].includes(result.urgency)).toBe(true);
  });

  it('urgency is reduced when network has robust alternatives', () => {
    const networkWithAlternatives = makeNetwork({ urgencyAdjustment: 0.5 });
    // With alternatives and moderate deviation, urgency should be reduced.
    decideAction('balanced', 0.42, targetBand, 'morning_peak', makeRisk(), networkWithAlternatives, 100);
    const noNetworkResult = decideAction(
      'deficit', 0.15, targetBand, 'morning_peak',
      makeRisk({ riskEmptyAt1h: 0.90 }), makeNetwork(), 100
    );
    const withNetworkResult = decideAction(
      'deficit', 0.15, targetBand, 'morning_peak',
      makeRisk({ riskEmptyAt1h: 0.90 }), makeNetwork({ urgencyAdjustment: 0.5 }), 100
    );
    const urgencyOrder = ['none', 'low', 'medium', 'high', 'critical'];
    expect(
      urgencyOrder.indexOf(withNetworkResult.urgency)
    ).toBeLessThanOrEqual(
      urgencyOrder.indexOf(noNetworkResult.urgency)
    );
  });

  it('always provides reasons', () => {
    const result = decideAction(
      'balanced', 0.5, targetBand, 'morning_peak',
      makeRisk(), makeNetwork(), 100
    );
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

// ─── Network context ──────────────────────────────────────────────────────────

describe('buildNetworkContext', () => {
  it('returns urgencyAdjustment 1.0 with no nearby stations', () => {
    const context = buildNetworkContext([], new Map());
    expect(context.urgencyAdjustment).toBe(1.0);
    expect(context.nearbyStations.length).toBe(0);
  });

  it('reduces urgency with one robust nearby station', () => {
    const nearby = [makeNearbyStation()];
    const currentBikes = new Map([
      ['neighbor-1', { bikesAvailable: 8, anchorsFree: 12 }],
    ]);
    const context = buildNetworkContext(nearby, currentBikes);
    expect(context.urgencyAdjustment).toBe(0.75);
  });

  it('reduces urgency to 0.5 with two or more robust alternatives', () => {
    const nearby = [
      makeNearbyStation({ stationId: 'n1', distanceMeters: 200, historicalRobustness: 0.70 }),
      makeNearbyStation({ stationId: 'n2', distanceMeters: 300, historicalRobustness: 0.60 }),
    ];
    const currentBikes = new Map([
      ['n1', { bikesAvailable: 8, anchorsFree: 12 }],
      ['n2', { bikesAvailable: 5, anchorsFree: 10 }],
    ]);
    const context = buildNetworkContext(nearby, currentBikes);
    expect(context.urgencyAdjustment).toBe(0.5);
  });

  it('does not count stations with fewer than 3 bikes as viable', () => {
    const nearby = [makeNearbyStation()];
    const currentBikes = new Map([
      ['neighbor-1', { bikesAvailable: 2, anchorsFree: 18 }], // too few bikes
    ]);
    const context = buildNetworkContext(nearby, currentBikes);
    expect(context.urgencyAdjustment).toBe(1.0); // no viable alternatives
  });
});

// ─── Transfer matching ────────────────────────────────────────────────────────

describe('computeTransfers', () => {
  function makeDiagnostic(
    id: string,
    name: string,
    action: 'donor' | 'receptor' | 'stable',
    currentOccupancy: number,
    nearbyStationId: string | null = null
  ): StationDiagnostic {
    const cap = 20;
    const bikes = Math.round(currentOccupancy * cap);
    const nearby = nearbyStationId
      ? [makeNearbyStation({ stationId: nearbyStationId, distanceMeters: 250 })]
      : [];

    return {
      stationId: id,
      stationName: name,
      districtName: 'Centro',
      capacity: cap,
      currentBikes: bikes,
      currentAnchors: cap - bikes,
      currentOccupancy,
      inferredType: 'mixed',
      classification: action === 'donor' ? 'overstock' : action === 'receptor' ? 'deficit' : 'balanced',
      classificationReasons: ['test'],
      globalMetrics: makeBaseMetrics(),
      timeBandMetrics: makeTimeBandMetrics(),
      targetBand: { min: 0.30, max: 0.65 },
      currentTimeBand: 'morning_peak',
      risk: makeRisk({ riskEmptyAt1h: action === 'receptor' ? 0.7 : 0.1 }),
      network: makeNetwork({ nearbyStations: nearby, urgencyAdjustment: 1.0 }),
      actionGroup: action,
      actionReasons: ['test'],
      urgency: action !== 'stable' ? 'high' : 'none',
      priorityScore: action !== 'stable' ? 0.7 : 0.0,
    };
  }

  it('returns empty list when no donors exist', () => {
    const diagnostics = [makeDiagnostic('r1', 'Receptora', 'receptor', 0.2)];
    expect(computeTransfers(diagnostics)).toHaveLength(0);
  });

  it('returns empty list when no receptors exist', () => {
    const diagnostics = [makeDiagnostic('d1', 'Donante', 'donor', 0.85)];
    expect(computeTransfers(diagnostics)).toHaveLength(0);
  });

  it('creates a transfer between donor and nearby receptor', () => {
    const diagnostics = [
      makeDiagnostic('d1', 'Donante', 'donor', 0.85, 'r1'),
      makeDiagnostic('r1', 'Receptora', 'receptor', 0.15, 'd1'),
    ];
    const transfers = computeTransfers(diagnostics);
    expect(transfers.length).toBeGreaterThan(0);
    const t = transfers[0]!;
    expect(t.originStationId).toBe('d1');
    expect(t.destinationStationId).toBe('r1');
    expect(t.bikesToMove).toBeGreaterThanOrEqual(2);
    expect(t.reasons.length).toBeGreaterThan(0);
  });

  it('does not create transfer when donor and receptor are not nearby', () => {
    const diagnostics = [
      makeDiagnostic('d1', 'Donante', 'donor', 0.85, null),   // no nearby
      makeDiagnostic('r1', 'Receptora', 'receptor', 0.15, null),
    ];
    const transfers = computeTransfers(diagnostics);
    expect(transfers.length).toBe(0);
  });
});

// ─── Impact and KPIs ─────────────────────────────────────────────────────────

describe('computeReportKPIs', () => {
  it('returns zero KPIs for empty inputs', () => {
    const kpis = computeReportKPIs([], []);
    expect(kpis.service.systemPctTimeEmpty).toBe(0);
    expect(kpis.service.systemPctTimeFull).toBe(0);
    expect(kpis.operation.suggestedTransfers).toBe(0);
    expect(kpis.impact.totalUsesRecovered).toBe(0);
  });

  it('correctly aggregates operation KPIs from transfers', () => {
    const mockTransfers = [
      {
        originStationId: 'a', originStationName: 'A',
        destinationStationId: 'b', destinationStationName: 'B',
        bikesToMove: 5,
        timeWindow: { start: '07:00', end: '10:00' },
        expectedImpact: { emptiesAvoided: 2, fullsAvoided: 1, usesRecovered: 3, costScore: 0.8 },
        matchScore: 0.7, logisticsScore: 0.6, confidence: 0.65, reasons: [],
      },
      {
        originStationId: 'c', originStationName: 'C',
        destinationStationId: 'd', destinationStationName: 'D',
        bikesToMove: 3,
        timeWindow: { start: '07:00', end: '10:00' },
        expectedImpact: { emptiesAvoided: 1, fullsAvoided: 0.5, usesRecovered: 1.5, costScore: 0.7 },
        matchScore: 0.5, logisticsScore: 0.4, confidence: 0.60, reasons: [],
      },
    ];
    const kpis = computeReportKPIs([], mockTransfers);
    expect(kpis.operation.suggestedTransfers).toBe(2);
    expect(kpis.operation.totalBikesMoved).toBe(8);
    expect(kpis.impact.totalEmptiesAvoided).toBeCloseTo(3);
    expect(kpis.impact.totalUsesRecovered).toBeCloseTo(4.5);
  });
});

describe('computeBaselineComparison', () => {
  it('always includes three scenarios', () => {
    const baseline = computeBaselineComparison([], []);
    expect(baseline.doNothing.label).toBeTruthy();
    expect(baseline.simpleRules.label).toBeTruthy();
    expect(baseline.recommended.label).toBeTruthy();
  });

  it('doNothing scenario always has zero moves and incidents avoided', () => {
    const baseline = computeBaselineComparison([], []);
    expect(baseline.doNothing.totalMoves).toBe(0);
    expect(baseline.doNothing.emptiesAvoided).toBe(0);
    expect(baseline.doNothing.fullsAvoided).toBe(0);
  });
});
