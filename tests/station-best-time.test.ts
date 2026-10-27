import { describe, expect, it } from 'vitest';
import type { StationPatternRow } from '@/lib/api-types';
import { buildStationBestTime, formatHourSpan, mergeHours } from '@/lib/station-best-time';

const row = (hour: number, bikesAvg: number, anchorsAvg: number, sampleCount = 10, dayType = 'WEEKDAY'): StationPatternRow => ({
  stationId: '1',
  dayType,
  hour,
  bikesAvg,
  anchorsAvg,
  occupancyAvg: bikesAvg / Math.max(bikesAvg + anchorsAvg, 1),
  sampleCount,
});

describe('buildStationBestTime', () => {
  it('merges consecutive hours into spans', () => {
    expect(mergeHours([9, 7, 8, 12])).toEqual([
      { startHour: 7, endHour: 10 },
      { startHour: 12, endHour: 13 },
    ]);
    expect(formatHourSpan({ startHour: 7, endHour: 10 })).toBe('07:00-10:00');
  });

  it('finds empty, full and better spans', () => {
    const result = buildStationBestTime([
      row(7, 0.2, 10),
      row(8, 0.5, 9),
      row(13, 5, 5),
      row(14, 6, 4),
      row(19, 10, 0.3),
    ]);
    expect(result.state).toBe('ok');
    const day = result.byDayType[0];
    expect(day.noBikes).toEqual([{ startHour: 7, endHour: 9 }]);
    expect(day.noAnchors).toEqual([{ startHour: 19, endHour: 20 }]);
    expect(day.better).toEqual([{ startHour: 13, endHour: 15 }]);
  });

  it('ignores slots with too few samples and degrades to empty', () => {
    expect(buildStationBestTime([row(7, 0, 10, 1)]).state).toBe('empty');
    expect(buildStationBestTime([]).state).toBe('empty');
  });

  it('completes full hours from peak slots not covered by patterns', () => {
    const result = buildStationBestTime(
      [row(13, 5, 5)],
      [
        { dayType: 'WEEKDAY', hour: 20, occupancyAvg: 0.95, sampleCount: 8 },
        { dayType: 'WEEKDAY', hour: 13, occupancyAvg: 0.95, sampleCount: 8 },
      ]
    );
    expect(result.byDayType[0].noAnchors).toEqual([{ startHour: 20, endHour: 21 }]);
  });
});
