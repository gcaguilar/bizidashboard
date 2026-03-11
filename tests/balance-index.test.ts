import { describe, expect, it } from 'vitest';
import type { StationSnapshot } from '@/lib/api';
import { calculateBalanceIndex } from '@/app/dashboard/_components/useSystemMetrics';

function buildStation(id: string, bikesAvailable: number, capacity = 10): StationSnapshot {
  return {
    id,
    name: `Station ${id}`,
    lat: 0,
    lon: 0,
    capacity,
    bikesAvailable,
    anchorsFree: capacity - bikesAvailable,
    recordedAt: new Date().toISOString(),
  };
}

describe('calculateBalanceIndex', () => {
  it('returns 1 when all stations are at 50%', () => {
    const stations = [buildStation('1', 5), buildStation('2', 5), buildStation('3', 5)];
    expect(calculateBalanceIndex(stations)).toBe(1);
  });

  it('returns 0 when all stations are empty or full', () => {
    const stations = [buildStation('1', 0), buildStation('2', 10), buildStation('3', 0), buildStation('4', 10)];
    expect(calculateBalanceIndex(stations)).toBe(0);
  });
});
