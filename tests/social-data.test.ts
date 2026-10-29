import { describe, expect, it } from 'vitest';

import {
  addDaysToDateKey,
  aggregateDistrictStats,
  evaluateHourlyActivityAnomaly,
  evaluateRobustAnomaly,
  findDroppingStations,
  findNearbyAlternative,
  getCompletedWeeksRange,
  getFeatureTheme,
  getIsoWeekday,
  getMonthKey,
  getMonthRange,
  getPreviousMonthKey,
  getPreviousWeekRange,
  getSlotDateKey,
  getSlotDueAt,
  getWeekRange,
  isSocialSlotDue,
  modelContradictsDrop,
  normalizeDistrictName,
  pickSpotlightDistrict,
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
  SocialDistrictStats,
} from '@/lib/social/types';

function districtStats(
  name: string,
  overrides: Partial<SocialDistrictStats> = {}
): SocialDistrictStats {
  return {
    district: name,
    stationCount: 1,
    activityIndex: 100,
    previousActivityIndex: 90,
    growthRatio: 0.1,
    emptyHours: 0,
    fullHours: 0,
    totalHours: 10,
    frictionRate: 0,
    ...overrides,
  };
}

const SPOTLIGHT_DISTRICTS: SocialDistrictStats[] = [
  'Actur',
  'Almozara',
  'Arrabal',
  'Casco Histórico',
  'Centro',
  'Delicias',
  'La Almozara',
  'Las Fuentes',
  'Miralbueno',
  'Oliver',
  'Rosales',
  'San José',
  'Santa Isabel',
  'Torrero',
  'Universidad',
].map((name) => districtStats(name));

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

  it('shows the usual stations with their bikes when everything is fine', () => {
    const selection = selectMorningStations({
      stations: [station('a', 5, 10), station('b', 6, 6), station('e', 9, 3), station('z', 12, 8)],
      profiles,
      limit: 2,
      cohortSize: 3,
    });

    expect(selection.mode).toBe('none');
    // Las mas habituales primero (e 0.9, a 0.5), con sus bicis actuales.
    expect(selection.stations.map((entry) => [entry.id, entry.bikesAvailable])).toEqual([
      ['e', 9],
      ['a', 5],
    ]);
  });

  it('lets a recent station lose a tie but never hides a critical one', () => {
    const tied = selectMorningStations({
      stations: [station('a', 0, 10), station('e', 0, 10)],
      profiles,
      limit: 1,
      cohortSize: 4,
      recentStationIds: ['e'],
    });
    expect(tied.mode).toBe('empty');
    expect(tied.stations.map((entry) => entry.id)).toEqual(['a']);

    const onlyCriticalIsRecent = selectMorningStations({
      stations: [station('e', 0, 10), station('a', 5, 5)],
      profiles,
      limit: 3,
      cohortSize: 4,
      recentStationIds: ['e'],
    });
    expect(onlyCriticalIsRecent.mode).toBe('empty');
    expect(onlyCriticalIsRecent.stations.map((entry) => entry.id)).toEqual(['e']);
  });

  it('rotates the usual cohort towards non-recent stations when all is fine', () => {
    const stations = [station('a', 5, 10), station('e', 9, 3)];
    const recent = selectMorningStations({
      stations,
      profiles,
      limit: 1,
      cohortSize: 3,
      recentStationIds: ['e'],
    });

    expect(recent.mode).toBe('none');
    expect(recent.stations.map((entry) => entry.id)).toEqual(['a']);
  });

  it('does not treat a nearly full station as low on bikes', () => {
    const selection = selectMorningStations({
      stations: [station('a', 18, 1), station('b', 17, 2), station('e', 20, 0.5)],
      profiles,
      limit: 3,
    });

    expect(selection.mode).toBe('none');
    expect(selection.stations.every((entry) => entry.bikesAvailable >= 3)).toBe(true);
  });
});

describe('stations dropping fast', () => {
  const now = new Date('2026-10-27T07:30:00.000Z');
  const at = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000).toISOString();
  const series = (stationId: string, bikes: number[]) =>
    bikes.map((value, index) => ({
      stationId,
      recordedAt: at(30 - index * 10),
      bikesAvailable: value,
    }));

  it('reports observed drops that would empty the station within half an hour', () => {
    const dropping = findDroppingStations({
      stations: [station('a', 3, 17), station('b', 9, 11), station('c', 0, 20)],
      samples: [
        ...series('a', [9, 7, 5, 3]),
        ...series('b', [10, 10, 9, 9]),
        ...series('c', [6, 4, 2, 0]),
      ],
      now,
    });

    expect(dropping).toEqual([
      { stationId: 'a', name: 'A', bikesBefore: 9, bikesNow: 3, minutes: 30 },
    ]);
  });

  it('needs enough readings, enough span and a real drop', () => {
    const base = { stations: [station('a', 2, 18)], now };

    expect(findDroppingStations({ ...base, samples: series('a', [6, 2]).slice(0, 2) })).toEqual([]);
    expect(
      findDroppingStations({
        ...base,
        samples: [
          { stationId: 'a', recordedAt: at(10), bikesAvailable: 6 },
          { stationId: 'a', recordedAt: at(5), bikesAvailable: 4 },
          { stationId: 'a', recordedAt: at(0), bikesAvailable: 2 },
        ],
      })
    ).toEqual([]);
    expect(findDroppingStations({ ...base, samples: series('a', [4, 3, 3, 2]) })).toEqual([]);
  });

  it('ignores stations with many bikes left or too slow to empty soon', () => {
    const dropping = findDroppingStations({
      stations: [station('a', 15, 5), station('b', 8, 12)],
      samples: [...series('a', [25, 21, 18, 15]), ...series('b', [12, 11, 10, 8])],
      now,
    });

    expect(dropping).toEqual([]);
  });

  it('orders by how soon they would empty and respects the limit', () => {
    const dropping = findDroppingStations({
      stations: [station('a', 4, 16), station('b', 2, 18), station('c', 3, 17)],
      samples: [
        ...series('a', [10, 8, 6, 4]),
        ...series('b', [8, 6, 4, 2]),
        ...series('c', [9, 7, 5, 3]),
      ],
      now,
      limit: 2,
    });

    expect(dropping.map((entry) => entry.stationId)).toEqual(['b', 'c']);
  });

  it('only lets a reliable model veto a drop', () => {
    expect(modelContradictsDrop({ predictedBikesAvailable: 6 }, true, 3)).toBe(true);
    expect(modelContradictsDrop({ predictedBikesAvailable: 1 }, true, 3)).toBe(false);
    expect(modelContradictsDrop({ predictedBikesAvailable: 6 }, false, 3)).toBe(false);
    expect(modelContradictsDrop({ predictedBikesAvailable: null }, true, 3)).toBe(false);
    expect(modelContradictsDrop(undefined, true, 3)).toBe(false);
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

  it('uses recency as a tie-break behind gravity and rotates the usual cohort', () => {
    const tied = selectEveningStations({
      stations: [station('a', 10, 0), station('e', 10, 0)],
      profiles,
      limit: 1,
      cohortSize: 4,
      recentStationIds: ['e'],
    });
    expect(tied.mode).toBe('full');
    expect(tied.stations.map((entry) => entry.id)).toEqual(['a']);

    const rotated = selectEveningStations({
      stations: [station('a', 5, 10), station('e', 5, 10)],
      profiles,
      limit: 1,
      cohortSize: 4,
      fallbackToCohort: true,
      recentStationIds: ['e'],
    });
    expect(rotated.mode).toBe('none');
    expect(rotated.stations.map((entry) => entry.id)).toEqual(['a']);
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

  it('keeps the usual-fill cohort when the caller asks for both sides', () => {
    const selection = selectEveningStations({
      stations: [station('a', 5, 10), station('e', 5, 10)],
      profiles,
      limit: 2,
      cohortSize: 2,
      fallbackToCohort: true,
    });

    expect(selection.mode).toBe('none');
    expect(selection.stations.map((entry) => entry.id)).toEqual(['e', 'a']);
  });
});

describe('weekly spotlight district', () => {
  it('does not repeat a district over six consecutive weeks', () => {
    const picked: string[] = [];
    let recent: string[] = [];
    let weekStart = '2026-01-05';

    for (let week = 0; week < 6; week += 1) {
      const district = pickSpotlightDistrict(SPOTLIGHT_DISTRICTS, recent, weekStart);
      expect(district).not.toBeNull();
      picked.push(district!.district);
      recent = [district!.district, ...recent];
      weekStart = addDaysToDateKey(weekStart, 7);
    }

    expect(new Set(picked).size).toBe(6);
  });

  it('is deterministic without history and rotates with the week', () => {
    const first = pickSpotlightDistrict(SPOTLIGHT_DISTRICTS, [], '2026-01-05');
    const same = pickSpotlightDistrict(SPOTLIGHT_DISTRICTS, [], '2026-01-05');
    const next = pickSpotlightDistrict(SPOTLIGHT_DISTRICTS, [], '2026-01-12');

    expect(first?.district).toBe(same?.district);
    expect(next?.district).not.toBe(first?.district);
  });

  it('skips districts without stations', () => {
    const empty = districtStats('Sin estaciones', { stationCount: 0 });
    const only = districtStats('Único');

    expect(pickSpotlightDistrict([empty], [], '2026-01-05')).toBeNull();
    expect(pickSpotlightDistrict([empty, only], [], '2026-01-05')?.district).toBe('Único');
  });

  it('falls back to the least recent district when all have been featured', () => {
    const districts = ['Centro', 'Delicias', 'Universidad'].map((name) =>
      districtStats(name)
    );
    // Historial de más reciente a más antiguo: Universidad salió la última.
    const picked = pickSpotlightDistrict(
      districts,
      ['Universidad', 'Delicias', 'Centro'],
      '2026-01-05'
    );

    expect(picked?.district).toBe('Centro');
  });

  it('compares district names ignoring case and accents', () => {
    const districts = [districtStats('Centro'), districtStats('Delicias')];
    const picked = pickSpotlightDistrict(districts, ['  CENTRO  '], '2026-01-05');

    expect(picked?.district).toBe('Delicias');
    expect(normalizeDistrictName('  Casco Histórico ')).toBe('casco historico');
  });
});

describe('weekly feature theme rotation', () => {
  it('rotates through five themes without repeats inside the cycle', () => {
    const themes = ['2026-01-07', '2026-01-14', '2026-01-21', '2026-01-28', '2026-02-04'].map(
      (dateKey) => getFeatureTheme(dateKey)
    );

    expect(new Set(themes).size).toBe(5);
    expect(themes).toEqual(['explainer', 'record', 'myth', 'network', 'station']);
  });

  it('is deterministic and repeats only after five weeks', () => {
    const first = getFeatureTheme('2026-01-07');
    const sixth = getFeatureTheme('2026-02-11');

    expect(getFeatureTheme('2026-01-07')).toBe(first);
    expect(sixth).toBe(first);
  });
});
