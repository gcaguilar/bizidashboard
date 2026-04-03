import { describe, expect, it } from 'vitest';
import { inferStationType } from '@/lib/station-typology';
import { DayType } from '@/analytics/types';
import type { StationPatternRow } from '@/lib/api';

describe('station-typology', () => {
  it('infers offices pattern when morning occupancy > evening occupancy', () => {
    const patterns: StationPatternRow[] = [
      {
        stationId: '1',
        dayType: DayType.WEEKDAY,
        hour: 8,
        occupancyAvg: 0.8,
        bikesAvg: 16,
        anchorsAvg: 4,
        sampleCount: 10,
      },
      {
        stationId: '1',
        dayType: DayType.WEEKDAY,
        hour: 18,
        occupancyAvg: 0.2,
        bikesAvg: 4,
        anchorsAvg: 16,
        sampleCount: 10,
      },
    ];

    const { type, reasons } = inferStationType(patterns);

    expect(type).toBe('offices');
    expect(reasons[0]).toContain('Patron de oficinas');
  });

  it('infers residential pattern when evening occupancy > morning occupancy', () => {
    const patterns: StationPatternRow[] = [
      {
        stationId: '1',
        dayType: DayType.WEEKDAY,
        hour: 8,
        occupancyAvg: 0.2,
        bikesAvg: 4,
        anchorsAvg: 16,
        sampleCount: 10,
      },
      {
        stationId: '1',
        dayType: DayType.WEEKDAY,
        hour: 18,
        occupancyAvg: 0.8,
        bikesAvg: 16,
        anchorsAvg: 4,
        sampleCount: 10,
      },
    ];

    const { type, reasons } = inferStationType(patterns);

    expect(type).toBe('residential');
    expect(reasons[0]).toContain('Patron residencial');
  });

  it('infers mixed pattern when no strong asymmetry exists', () => {
    const patterns: StationPatternRow[] = [
      {
        stationId: '1',
        dayType: DayType.WEEKDAY,
        hour: 8,
        occupancyAvg: 0.5,
        bikesAvg: 10,
        anchorsAvg: 10,
        sampleCount: 10,
      },
      {
        stationId: '1',
        dayType: DayType.WEEKDAY,
        hour: 18,
        occupancyAvg: 0.5,
        bikesAvg: 10,
        anchorsAvg: 10,
        sampleCount: 10,
      },
    ];

    const { type } = inferStationType(patterns);

    expect(type).toBe('mixed');
  });
});
