import { describe, expect, it } from 'vitest';
import { computeTransfers, DEFAULT_LOGISTICS_CONFIG } from '@/lib/rebalancing-matching';
import type { StationDiagnostic } from '@/types/rebalancing';

const mockStations = [
  { id: '1', lat: 0, lon: 0 },
  { id: '2', lat: 0.01, lon: 0 },
  { id: '3', lat: 10, lon: 10 },
];

const donor: Partial<StationDiagnostic> = {
  stationId: '1',
  capacity: 20,
  currentBikes: 18,
  targetBand: { min: 0.3, max: 0.6 },
  actionGroup: 'donor',
  priorityScore: 0.8,
  risk: { riskFullAt1h: 0.9, riskEmptyAt1h: 0, demandNextHour: 2 } as any,
};

const receptor: Partial<StationDiagnostic> = {
  stationId: '2',
  capacity: 20,
  currentBikes: 2,
  targetBand: { min: 0.3, max: 0.6 },
  actionGroup: 'receptor',
  priorityScore: 0.9,
  risk: { riskFullAt1h: 0, riskEmptyAt1h: 0.9, demandNextHour: 2 } as any,
};

describe('rebalancing-matching', () => {
  it('matches a donor and receptor successfully', () => {
    const transfers = computeTransfers(
      [donor as any, receptor as any],
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
      [donor as any, receptorFar as any],
      mockStations,
      DEFAULT_LOGISTICS_CONFIG
    );

    expect(transfers).toHaveLength(0);
  });
});
