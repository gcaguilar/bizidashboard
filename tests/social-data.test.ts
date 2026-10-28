import { describe, expect, it } from 'vitest';

import {
  addDaysToDateKey,
  aggregateDistrictStats,
  evaluateHourlyActivityAnomaly,
  evaluateRobustAnomaly,
  findNearbyAlternative,
  getCompletedWeeksRange,
  getIsoWeekday,
  getMonthKey,
  getMonthRange,
  getPreviousMonthKey,
  getPreviousWeekRange,
  getSlotDateKey,
  getSlotDueAt,
  getWeekRange,
  isSocialSlotDue,
  selectEveningStations,
  selectMorningStations,
  startOfWeek,
  toDateKey,
  topDistrictsByActivity,
  topDistrictsByFriction,
  topDistrictsByGrowth,
  zonedTimeToUtc,
} from '@/lib/social/data';
import type {
  SocialDistrictDemandRow,
  SocialDistrictFrictionRow,
} from '@/lib/social/types';

describe('social date helpers', () => {
  it('uses Europe/Madrid for the date key', () => {
    expect(toDateKey(new Date('2026-10-27T22:30:00.000Z'))).toBe('2026-10-27');
    expect(toDateKey(new Date('2026-10-27T23:30:00.000Z'))).toBe('2026-10-28');
  });

  it('starts weeks on Monday and numbers ISO weekdays', () => {
    expect(startOfWeek('2026-10-27')).toBe('2026-10-26');
    expect(getIsoWeekday('2026-10-26')).toBe(1);
    expect(getIsoWeekday('2026-11-01')).toBe(7);
    expect(addDaysToDateKey('2026-10-31', 1)).toBe('2026-11-01');
  });

  it('returns the current week bounds with the right offsets', () => {
    expect(getWeekRange('2026-10-27')).toEqual({
      weekStart: '2026-10-26',
      weekEnd: '2026-11-01',
      startIso: '2026-10-25T23:00:00.000Z',
      endExclusiveIso: '2026-11-01T23:00:00.000Z',
    });
  });

  it('handles the spring DST change in a week range', () => {
    expect(getWeekRange('2026-03-25')).toEqual({
      weekStart: '2026-03-23',
      weekEnd: '2026-03-29',
      startIso: '2026-03-22T23:00:00.000Z',
      endExclusiveIso: '2026-03-29T22:00:00.000Z',
    });
    expect(zonedTimeToUtc('2026-03-29', 12, 0).toISOString()).toBe(
      '2026-03-29T10:00:00.000Z'
    );
  });

  it('returns the previous complete week across the autumn DST change', () => {
    expect(getPreviousWeekRange(new Date('2026-10-27T10:00:00.000Z'))).toEqual({
      weekStart: '2026-10-19',
      weekEnd: '2026-10-25',
      startIso: '2026-10-18T22:00:00.000Z',
      endExclusiveIso: '2026-10-25T23:00:00.000Z',
    });
  });

  it('returns the last N completed weeks, excluding the current one', () => {
    expect(
      getCompletedWeeksRange(new Date('2026-10-27T10:00:00.000Z'), 2)
    ).toEqual({
      startDateKey: '2026-10-12',
      endDateKey: '2026-10-25',
      startIso: '2026-10-11T22:00:00.000Z',
      endExclusiveIso: '2026-10-25T23:00:00.000Z',
    });
  });

  it('derives month keys and complete month ranges locally', () => {
    const lateOctober = new Date('2026-10-31T23:30:00.000Z');
    expect(getMonthKey(lateOctober)).toBe('2026-11');
    expect(getPreviousMonthKey(lateOctober)).toBe('2026-10');
    expect(getMonthRange('2026-11')).toEqual({
      startDateKey: '2026-11-01',
      endDateKey: '2026-11-30',
      startIso: '2026-10-31T23:00:00.000Z',
      endExclusiveIso: '2026-11-30T23:00:00.000Z',
    });
  });

  it('computes slot date keys, due times and the catch-up window', () => {
    const morning = new Date('2026-10-27T07:35:00.000Z');
    expect(getSlotDueAt('morning', morning).toISOString()).toBe(
      '2026-10-27T07:30:00.000Z'
    );
    expect(isSocialSlotDue('morning', morning, 120)).toBe(true);
    expect(
      isSocialSlotDue('morning', new Date('2026-10-27T09:30:00.000Z'), 120)
    ).toBe(true);
    expect(
      isSocialSlotDue('morning', new Date('2026-10-27T09:31:00.000Z'), 120)
    ).toBe(false);

    const tuesday = new Date('2026-10-27T10:00:00.000Z');
    expect(getSlotDateKey('weekly', tuesday)).toBe('2026-10-26');
    expect(getSlotDueAt('weekly', tuesday).toISOString()).toBe(
      '2026-10-26T08:00:00.000Z'
    );
    expect(isSocialSlotDue('weekly', tuesday, 120)).toBe(false);

    const firstOfMonth = new Date('2026-11-01T09:30:00.000Z');
    expect(getSlotDateKey('monthly', firstOfMonth)).toBe('2026-11');
    expect(getSlotDueAt('monthly', firstOfMonth).toISOString()).toBe(
      '2026-11-01T09:00:00.000Z'
    );
    expect(isSocialSlotDue('monthly', firstOfMonth, 60)).toBe(true);
  });
});

describe('district aggregation', () => {
  const current: SocialDistrictDemandRow[] = [
    { stationId: 's1', district: 'Centro', activityIndex: 100 },
    { stationId: 's2', district: 'Centro', activityIndex: 50 },
    { stationId: 's3', district: 'Delicias', activityIndex: 80 },
    { stationId: 's4', district: 'Actur', activityIndex: 100 },
    { stationId: 's9', activityIndex: 999 },
  ];

  const previous: SocialDistrictDemandRow[] = [
    { stationId: 's1', district: 'Centro', activityIndex: 60 },
    { stationId: 's2', district: 'Centro', activityIndex: 40 },
    { stationId: 's3', district: 'Delicias', activityIndex: 100 },
  ];

  const friction: SocialDistrictFrictionRow[] = [
    { stationId: 's1', district: 'Centro', emptyHours: 2, fullHours: 1, totalHours: 10 },
    { stationId: 's2', district: 'Centro', emptyHours: 0, fullHours: 3, totalHours: 10 },
    { stationId: 's3', district: 'Delicias', emptyHours: 6, fullHours: 0, totalHours: 10 },
    { stationId: 's4', district: 'Actur', emptyHours: 1, fullHours: 1, totalHours: 4 },
  ];

  it('sums activity and hours, and ignores unmapped stations', () => {
    const stats = aggregateDistrictStats({ current, previous, friction });

    expect(stats).toHaveLength(3);
    expect(stats.find((entry) => entry.district === 'Centro')).toEqual({
      district: 'Centro',
      stationCount: 2,
      activityIndex: 150,
      previousActivityIndex: 100,
      growthRatio: 0.5,
      emptyHours: 2,
      fullHours: 4,
      totalHours: 20,
      frictionRate: 0.3,
    });
    expect(stats.map((entry) => entry.district)).toEqual([
      'Centro',
      'Actur',
      'Delicias',
    ]);
    expect(stats.find((entry) => entry.district === 'Actur')?.growthRatio).toBeNull();
  });

  it('uses the station-to-district map as a fallback', () => {
    const stats = aggregateDistrictStats({
      current: [{ stationId: 'x1', activityIndex: 30 }],
      districtByStation: new Map([['x1', 'Universidad']]),
    });

    expect(stats).toEqual([
      {
        district: 'Universidad',
        stationCount: 1,
        activityIndex: 30,
        previousActivityIndex: 0,
        growthRatio: null,
        emptyHours: 0,
        fullHours: 0,
        totalHours: 0,
        frictionRate: 0,
      },
    ]);
  });

  it('picks top districts with deterministic tie-breaking', () => {
    const tied = aggregateDistrictStats({
      current: [
        { stationId: 'z', district: 'Zeta', activityIndex: 100 },
        { stationId: 'a', district: 'Alfa', activityIndex: 100 },
        { stationId: 'm', district: 'Media', activityIndex: 40 },
      ],
    });

    expect(topDistrictsByActivity(tied, 2).map((entry) => entry.district)).toEqual([
      'Alfa',
      'Zeta',
    ]);
  });

  it('picks growth and friction leaders', () => {
    const stats = aggregateDistrictStats({ current, previous, friction });

    expect(topDistrictsByGrowth(stats, 3)[0]?.district).toBe('Centro');
    expect(topDistrictsByGrowth(stats, 3).map((entry) => entry.district)).toEqual([
      'Centro',
      'Delicias',
    ]);
    expect(topDistrictsByFriction(stats)[0]?.district).toBe('Delicias');
  });
});

describe('robust anomalies', () => {
  it('uses the MAD z-score with the project threshold', () => {
    const baseline = [10, 12, 11, 13, 12];

    const notAnomaly = evaluateRobustAnomaly(15, baseline);
    expect(notAnomaly?.method).toBe('mad');
    expect(notAnomaly?.isAnomaly).toBe(false);
    expect(notAnomaly?.zScore).toBeCloseTo(2.0235, 3);

    const anomaly = evaluateRobustAnomaly(16, baseline);
    expect(anomaly).toMatchObject({
      baseline: 12,
      mad: 1,
      method: 'mad',
      isAnomaly: true,
      direction: 'up',
    });
    expect(anomaly?.zScore).toBeCloseTo(2.698, 3);
  });

  it('falls back to the 35% deviation when MAD is zero', () => {
    const baseline = [10, 10, 10];

    const slight = evaluateRobustAnomaly(13, baseline);
    expect(slight).toMatchObject({
      mad: 0,
      zScore: null,
      method: 'fallback',
      isAnomaly: false,
    });

    const anomaly = evaluateRobustAnomaly(14, baseline);
    expect(anomaly).toMatchObject({
      baseline: 10,
      deviationRatio: 0.4,
      method: 'fallback',
      isAnomaly: true,
      direction: 'up',
    });

    expect(evaluateRobustAnomaly(6, baseline)).toMatchObject({
      isAnomaly: true,
      direction: 'down',
    });
  });

  it('needs at least three samples', () => {
    expect(evaluateRobustAnomaly(100, [10, 10])).toBeNull();
    expect(
      evaluateRobustAnomaly(100, [10, 10], { minSamples: 2 })?.isAnomaly
    ).toBe(true);
  });

  it('matches the same ISO weekday and hour', () => {
    const samples = [
      { weekday: 2, hour: 8, activityIndex: 10 },
      { weekday: 2, hour: 8, activityIndex: 10 },
      { weekday: 2, hour: 8, activityIndex: 10 },
      { weekday: 2, hour: 9, activityIndex: 999 },
      { weekday: 3, hour: 8, activityIndex: 999 },
    ];

    expect(evaluateHourlyActivityAnomaly(15, samples, 2, 8)).toMatchObject({
      baseline: 10,
      isAnomaly: true,
    });
    expect(evaluateHourlyActivityAnomaly(15, samples, 4, 8)).toBeNull();
  });
});

const station = (
  id: string,
  bikesAvailable: number,
  anchorsFree: number
): { id: string; name: string; capacity: number; bikesAvailable: number; anchorsFree: number } => ({
  id,
  name: id.toUpperCase(),
  capacity: 20,
  bikesAvailable,
  anchorsFree,
});

describe('morning station selection', () => {
  const profiles = [
    { stationId: 'e', emptyShare: 0.9 },
    { stationId: 'a', emptyShare: 0.5 },
    { stationId: 'b', emptyShare: 0.4 },
    { stationId: 'c', emptyShare: 0.3 },
    { stationId: 'd', emptyShare: 0.2 },
  ];

  it('selects zero-bike stations inside the key cohort, deterministically', () => {
    const stations = [
      station('a', 0, 10),
      station('b', 4, 4),
      station('c', 2, 10),
      station('d', 1, 10),
      station('e', 0, 10),
    ];

    const selection = selectMorningStations({
      stations,
      profiles,
      limit: 2,
      cohortSize: 4,
    });

    expect(selection.mode).toBe('empty');
    expect(selection.stations.map((entry) => entry.id)).toEqual(['e', 'a']);
  });

  it('falls back to low availability when nothing is empty', () => {
    const stations = [
      station('a', 5, 10),
      station('b', 4, 4),
      station('c', 2, 10),
      station('d', 1, 10),
      station('e', 5, 10),
    ];

    const selection = selectMorningStations({
      stations,
      profiles,
      limit: 1,
      cohortSize: 4,
    });

    expect(selection.mode).toBe('low');
    expect(selection.stations.map((entry) => entry.id)).toEqual(['c']);
  });

  it('uses the whole network as cohort when there is no profile history', () => {
    const selection = selectMorningStations({
      stations: [station('a', 0, 10), station('b', 4, 4)],
      profiles: [],
      limit: 1,
    });

    expect(selection.mode).toBe('empty');
    expect(selection.stations.map((entry) => entry.id)).toEqual(['a']);
  });

  it('returns none when the cohort has no empty or low station', () => {
    const selection = selectMorningStations({
      stations: [station('a', 5, 10), station('b', 6, 6)],
      profiles: [],
      limit: 3,
    });

    expect(selection).toEqual({ mode: 'none', stations: [] });
  });
});

describe('nearby alternative', () => {
  const at = (id: string, name: string, bikesAvailable: number, dLat: number) => ({
    id,
    name,
    capacity: 20,
    bikesAvailable,
    anchorsFree: 20 - bikesAvailable,
    lat: 41.65 + dLat,
    lon: -0.88,
  });
  const origin = at('o', 'Plaza España', 0, 0);

  it('suggests the nearest station with enough bikes, rounded to 10 m', () => {
    const alternative = findNearbyAlternative(origin, [
      origin,
      at('far', 'Lejos', 12, 0.005),
      at('near', 'Independencia', 8, 0.0025),
      at('few', 'Casi vacía', 2, 0.001),
    ]);

    expect(alternative).toEqual({
      fromStationId: 'o',
      name: 'Independencia',
      kind: 'bikes',
      distanceMeters: 280,
      available: 8,
    });
  });

  it('looks for free anchors when the station is full', () => {
    const full = { ...origin, bikesAvailable: 20, anchorsFree: 0 };
    const alternative = findNearbyAlternative(
      full,
      [
        full,
        { ...at('bikes', 'Solo bicis', 19, 0.001), anchorsFree: 1 },
        { ...at('free', 'Con huecos', 5, 0.0025), anchorsFree: 15 },
      ],
      { kind: 'anchors' }
    );

    expect(alternative).toEqual({
      fromStationId: 'o',
      name: 'Con huecos',
      kind: 'anchors',
      distanceMeters: 280,
      available: 15,
    });
  });

  it('suggests nothing when every candidate is too far or has too few bikes', () => {
    expect(
      findNearbyAlternative(origin, [
        origin,
        at('far', 'Lejos', 12, 0.01),
        at('few', 'Casi vacía', 2, 0.001),
      ])
    ).toBeNull();
  });
});

describe('evening station selection', () => {
  const profiles = [
    { stationId: 'e', fullShare: 0.9 },
    { stationId: 'a', fullShare: 0.5 },
    { stationId: 'b', fullShare: 0.4 },
    { stationId: 'c', fullShare: 0.3 },
    { stationId: 'd', fullShare: 0.2 },
  ];

  it('selects stations without free anchors inside the usual-to-fill cohort', () => {
    const stations = [
      station('a', 10, 0),
      station('b', 4, 4),
      station('c', 10, 2),
      station('d', 10, 0),
      station('e', 10, 0),
    ];

    const selection = selectEveningStations({ stations, profiles, limit: 2, cohortSize: 4 });

    // d queda fuera de la cohorte de 4 (la menos habitual); e va antes que a.
    expect(selection.mode).toBe('full');
    expect(selection.stations.map((entry) => entry.id)).toEqual(['e', 'a']);
  });

  it('falls back to stations with only one or two free anchors', () => {
    const stations = [station('a', 10, 5), station('b', 10, 2), station('c', 10, 1), station('e', 10, 8)];
    const selection = selectEveningStations({ stations, profiles, limit: 2, cohortSize: 4 });

    expect(selection.mode).toBe('low');
    expect(selection.stations.map((entry) => entry.id)).toEqual(['c', 'b']);
  });

  it('returns none when the usual stations still have anchors', () => {
    const selection = selectEveningStations({
      stations: [station('a', 5, 10), station('e', 5, 10)],
      profiles,
    });

    expect(selection).toEqual({ mode: 'none', stations: [] });
  });
});
