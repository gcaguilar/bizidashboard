import { describe, expect, it } from 'vitest';
import { computeTransfers, DEFAULT_LOGISTICS_CONFIG } from '@/lib/rebalancing-matching';
import type { RiskAssessment, StationDiagnostic } from '@/types/rebalancing';

const mockStations = [
  { id: '1', lat: 0, lon: 0 },
  { id: '2', lat: 0.01, lon: 0 },
  { id: '3', lat: 10, lon: 10 },
];

const riskDonor: RiskAssessment = {
  riskEmptyAt1h: 0,
  riskEmptyAt3h: 0,
  riskFullAt1h: 0.9,
  riskFullAt3h: 0.5,
  demandNextHour: 2,
  demandNext3Hours: 6,
  selfCorrectionProbability: 0,
  estimatedRecoveryMinutes: null,
  confidence: 0.8,
};

const riskReceptor: RiskAssessment = {
  riskEmptyAt1h: 0.9,
  riskEmptyAt3h: 0.6,
  riskFullAt1h: 0,
  riskFullAt3h: 0,
  demandNextHour: 2,
  demandNext3Hours: 6,
  selfCorrectionProbability: 0,
  estimatedRecoveryMinutes: null,
  confidence: 0.8,
};

const donor: Partial<StationDiagnostic> = {
  stationId: '1',
  capacity: 20,
  currentBikes: 18,
  targetBand: { min: 0.3, max: 0.6 },
  actionGroup: 'donor',
  priorityScore: 0.8,
  risk: riskDonor,
};

const receptor: Partial<StationDiagnostic> = {
  stationId: '2',
  capacity: 20,
  currentBikes: 2,
  targetBand: { min: 0.3, max: 0.6 },
  actionGroup: 'receptor',
  priorityScore: 0.9,
  risk: riskReceptor,
};

function toDiagnostic(input: Partial<StationDiagnostic>): StationDiagnostic {
  return input as unknown as StationDiagnostic;
}

describe('rebalancing-matching', () => {
  it('matches a donor and receptor successfully', () => {
    const transfers = computeTransfers(
      [toDiagnostic(donor), toDiagnostic(receptor)],
      mockStations,
      DEFAULT_LOGISTICS_CONFIG
    );

    expect(transfers).toHaveLength(1);
    expect(transfers[0].originStationId).toBe('1');
    expect(transfers[0].destinationStationId).toBe('2');
    expect(transfers[0].bikesToMove).toBe(4);
  });

  it('ignores stations too far away', () => {
    const receptorFar = { ...receptor, stationId: '3' };
    const transfers = computeTransfers(
      [toDiagnostic(donor), toDiagnostic(receptorFar)],
      mockStations,
      DEFAULT_LOGISTICS_CONFIG
    );

    expect(transfers).toHaveLength(0);
  });
});
