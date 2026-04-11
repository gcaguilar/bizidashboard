import { describe, expect, it } from 'vitest';
import { decideAction } from '@/lib/rebalancing-engine';
import type { TargetBand, StationDiagnostic } from '@/types/rebalancing';

const baseDiag = {
  capacity: 20,
  currentBikes: 10,
  targetBand: { min: 0.3, max: 0.7 } as TargetBand,
  classification: 'balanced' as const,
  risk: {
    riskEmptyAt1h: 0,
    riskEmptyAt3h: 0,
    riskFullAt1h: 0,
    riskFullAt3h: 0,
    demandNextHour: 5,
    demandNext3Hours: 12,
    selfCorrectionProbability: 0,
    estimatedRecoveryMinutes: null,
    confidence: 0.5,
  },
  network: {
    urgencyAdjustment: 1.0,
    nearbyStations: [],
    clusterCapacity: 0,
    clusterAvailability: 0,
  },
} as Partial<StationDiagnostic>;

describe('rebalancing-engine', () => {
  it('rule 0: review data', () => {
    const res = decideAction({ ...baseDiag, classification: 'data_review' });
    expect(res.actionGroup).toBe('review');
    expect(res.urgency).toBe('none');
  });

  it('rule 1: self-correction', () => {
    const res = decideAction({
      ...baseDiag,
      risk: { ...baseDiag.risk!, selfCorrectionProbability: 0.8, estimatedRecoveryMinutes: 30 },
    });
    expect(res.actionGroup).toBe('stable');
    expect(res.urgency).toBe('none');
  });

  it('rule 3: donor', () => {
    const res = decideAction({
      ...baseDiag,
      currentBikes: 18,
      risk: { ...baseDiag.risk!, riskFullAt1h: 0.9 },
    });
    expect(res.actionGroup).toBe('donor');
    expect(res.urgency).toBe('high');
  });

  it('rule 4: receptor', () => {
    const res = decideAction({
      ...baseDiag,
      currentBikes: 2,
      risk: { ...baseDiag.risk!, riskEmptyAt1h: 0.9 },
    });
    expect(res.actionGroup).toBe('receptor');
    expect(res.urgency).toBe('critical');
  });
});
