import { describe, expect, it } from 'vitest';

import type { StationDailyDemandRow } from '@/analytics/queries/read';
import type { CriticalEpisodeRow } from '@/analytics/queries/rebalancing';
import type {
  HourlyNetworkActivityBaselineRow,
  LatestHourMobilityRow,
  WeekdayMorningProfileRow,
  WeeklyStationFrictionRow,
} from '@/analytics/queries/social';
import type { NetworkHealth } from '@/lib/network-health';
import type { ServiceCause } from '@/lib/service-calendar';
import type { RobustAnomaly } from '@/lib/social/data';

import {
  aggregateEveningProfiles,
  aggregateMorningProfiles,
  aggregateStationProfiles,
  filterCurrentEpisodes,
  getLatestBucketContext,
  getLatestMobilityBucketStart,
  isLatestMobilityFresh,
  getLatestRecordedAt,
  isStationSnapshotFresh,
  mapActiveAlerts,
  mapAfternoonAnomaly,
  mapCriticalEpisodes,
  mapDailyDemandRows,
  mapHourlyActivitySamples,
  mapLatestHourDemandRows,
  mapNetworkHealth,
  mapServiceCause,
  mapWeeklyFrictionRows,
  sumLatestHourActivity,
} from '@/jobs/social/mappers';

const NOW = new Date('2026-10-27T07:30:00.000Z');

function mobilityRow(
  overrides: Partial<LatestHourMobilityRow> & { stationId: string }
): LatestHourMobilityRow {
  return {
    bucketStart: '2026-10-27T06:00:00.000Z',
    hour: 7,
    departures: 0,
    arrivals: 0,
    activityIndex: 0,
    sampleCount: 1,
    ...overrides,
  };
}

describe('aggregateStationProfiles', () => {
  it('weights both shares by sampleCount and keeps them side by side', () => {
    expect(
      aggregateStationProfiles([
        { stationId: 'A', isoWeekday: 1, hour: 12, emptyShare: 1, fullShare: 0, sampleCount: 10 },
        { stationId: 'A', isoWeekday: 2, hour: 13, emptyShare: 0, fullShare: 0.5, sampleCount: 30 },
        { stationId: 'B', isoWeekday: 1, hour: 12, emptyShare: 0, fullShare: 1, sampleCount: 4 },
      ])
    ).toEqual([
      { stationId: 'A', emptyShare: 0.25, fullShare: 0.375, sampleCount: 40 },
      { stationId: 'B', emptyShare: 0, fullShare: 1, sampleCount: 4 },
    ]);
  });
});

describe('aggregateMorningProfiles', () => {
  it('weights emptyShare by sampleCount and sums samples per station', () => {
    const rows: WeekdayMorningProfileRow[] = [
      { stationId: 'A', isoWeekday: 1, hour: 7, emptyShare: 1, sampleCount: 10 },
      { stationId: 'A', isoWeekday: 2, hour: 8, emptyShare: 0, sampleCount: 30 },
      { stationId: 'B', isoWeekday: 1, hour: 7, emptyShare: 0.5, sampleCount: 4 },
    ];

    expect(aggregateMorningProfiles(rows)).toEqual([
      { stationId: 'A', emptyShare: 0.25, sampleCount: 40 },
      { stationId: 'B', emptyShare: 0.5, sampleCount: 4 },
    ]);
  });

  it('falls back to the simple mean when a station has no samples', () => {
    const rows: WeekdayMorningProfileRow[] = [
      { stationId: 'A', isoWeekday: 1, hour: 7, emptyShare: 0.2, sampleCount: 0 },
      { stationId: 'A', isoWeekday: 2, hour: 8, emptyShare: 0.8, sampleCount: 0 },
    ];

    const [profile] = aggregateMorningProfiles(rows);
    expect(profile?.stationId).toBe('A');
    expect(profile?.emptyShare).toBeCloseTo(0.5);
    expect(profile?.sampleCount).toBe(0);
  });
});

describe('aggregateEveningProfiles', () => {
  it('weights fullShare by sampleCount per station', () => {
    expect(
      aggregateEveningProfiles([
        { stationId: 'A', isoWeekday: 1, hour: 17, fullShare: 1, sampleCount: 10 },
        { stationId: 'A', isoWeekday: 2, hour: 18, fullShare: 0, sampleCount: 30 },
      ])
    ).toEqual([{ stationId: 'A', fullShare: 0.25, sampleCount: 40 }]);
  });
});

describe('snapshot freshness', () => {
  const stations = [
    { recordedAt: '2026-10-27T07:20:00.000Z' },
    { recordedAt: '2026-10-27T07:25:00.000Z' },
  ];

  it('takes the most recent recordedAt', () => {
    expect(getLatestRecordedAt(stations)).toBe('2026-10-27T07:25:00.000Z');
    expect(getLatestRecordedAt([])).toBeNull();
  });

  it('accepts a snapshot within ten minutes and rejects an older one', () => {
    expect(isStationSnapshotFresh(stations, NOW)).toBe(true);
    expect(
      isStationSnapshotFresh(
        [{ recordedAt: '2026-10-27T07:19:59.000Z' }],
        NOW
      )
    ).toBe(false);
    expect(isStationSnapshotFresh([], NOW)).toBe(false);
  });

  it('treats a future timestamp as fresh instead of blocking on clock skew', () => {
    expect(isStationSnapshotFresh([{ recordedAt: '2026-10-27T07:31:00.000Z' }], NOW)).toBe(
      true
    );
  });

  it('rejects an hourly bucket older than two hours', () => {
    expect(
      getLatestMobilityBucketStart([
        mobilityRow({ stationId: 'S1', bucketStart: '2026-10-27T05:00:00.000Z' }),
        mobilityRow({ stationId: 'S2', bucketStart: '2026-10-27T06:00:00.000Z' }),
      ])
    ).toBe('2026-10-27T06:00:00.000Z');

    expect(
      isLatestMobilityFresh(
        [mobilityRow({ stationId: 'S1', bucketStart: '2026-10-27T06:00:00.000Z' })],
        NOW
      )
    ).toBe(true);
    expect(
      isLatestMobilityFresh(
        [mobilityRow({ stationId: 'S1', bucketStart: '2026-10-27T04:00:00.000Z' })],
        NOW
      )
    ).toBe(false);
    expect(isLatestMobilityFresh([], NOW)).toBe(false);
  });
});

describe('district demand mapping', () => {
  it('maps latest-hour departures and resolves districts', () => {
    const rows = [
      mobilityRow({ stationId: 'S2', departures: 7 }),
      mobilityRow({ stationId: 'S1', departures: 3 }),
    ];

    expect(
      mapLatestHourDemandRows(rows, new Map([['S1', 'Centro'], ['S2', 'Delicias']]))
    ).toEqual([
      { stationId: 'S1', district: 'Centro', activityIndex: 3 },
      { stationId: 'S2', district: 'Delicias', activityIndex: 7 },
    ]);
  });

  it('sums activity and derives the local weekday/hour of the latest bucket', () => {
    const rows = [
      mobilityRow({ stationId: 'S1', activityIndex: 10 }),
      mobilityRow({ stationId: 'S2', activityIndex: 4 }),
    ];

    expect(sumLatestHourActivity(rows)).toBe(14);
    expect(getLatestBucketContext(rows)).toEqual({ weekday: 2, hour: 7 });
  });

  it('filters and sums daily demand inside the requested window', () => {
    const rows: StationDailyDemandRow[] = [
      { stationId: 'S1', day: '2026-10-25', demandScore: 100, avgOccupancy: 0.4, sampleCount: 1 },
      { stationId: 'S1', day: '2026-10-26', demandScore: 10, avgOccupancy: 0.4, sampleCount: 1 },
      { stationId: 'S1', day: '2026-10-27', demandScore: 5, avgOccupancy: 0.4, sampleCount: 1 },
      { stationId: 'S2', day: '2026-10-27', demandScore: 20, avgOccupancy: 0.4, sampleCount: 1 },
    ];

    expect(
      mapDailyDemandRows(rows, {
        startDateKey: '2026-10-26',
        endDateKey: '2026-11-01',
        districtByStation: new Map([['S2', 'Centro']]),
      })
    ).toEqual([
      { stationId: 'S1', district: null, activityIndex: 15 },
      { stationId: 'S2', district: 'Centro', activityIndex: 20 },
    ]);
  });

  it('maps weekly friction rows and clamps negative counters', () => {
    const rows: WeeklyStationFrictionRow[] = [
      { stationId: 'S1', emptyHours: 3, fullHours: 1, totalHours: 10 },
      { stationId: 'S2', emptyHours: -1, fullHours: 2, totalHours: 8 },
    ];

    expect(mapWeeklyFrictionRows(rows, new Map([['S1', 'Centro']]))).toEqual([
      {
        stationId: 'S1',
        district: 'Centro',
        emptyHours: 3,
        fullHours: 1,
        totalHours: 10,
      },
      {
        stationId: 'S2',
        district: null,
        emptyHours: 0,
        fullHours: 2,
        totalHours: 8,
      },
    ]);
  });
});

describe('afternoon alert and episode mapping', () => {
  it('keeps only alerts inside the three-hour window and sorts by severity', () => {
    const alerts = [
      {
        stationId: 'S1',
        alertType: 'LOW_BIKES',
        severity: 1,
        metricValue: 2,
        windowHours: 3,
      },
      {
        stationId: 'S2',
        alertType: 'LOW_ANCHORS',
        severity: 2,
        metricValue: 1,
        windowHours: 3,
      },
      {
        stationId: 'S3',
        alertType: 'LOW_BIKES',
        severity: 9,
        metricValue: 0,
        windowHours: 6,
      },
    ];

    expect(
      mapActiveAlerts(alerts, new Map([['S1', 'Plaza España']]))
    ).toEqual([
      {
        stationId: 'S2',
        stationName: 'S2',
        alertType: 'LOW_ANCHORS',
        severity: 2,
        metricValue: 1,
        windowHours: 3,
      },
      {
        stationId: 'S1',
        stationName: 'Plaza España',
        alertType: 'LOW_BIKES',
        severity: 1,
        metricValue: 2,
        windowHours: 3,
      },
    ]);
  });

  it('chooses the larger critical episode and breaks ties toward empty', () => {
    const episodes: Record<string, CriticalEpisodeRow> = {
      S1: {
        stationId: 'S1',
        avgEmptyEpisodeMinutes: 30,
        avgFullEpisodeMinutes: 20,
        maxEmptyEpisodeMinutes: 100,
        maxFullEpisodeMinutes: 220,
        episodeCount: 2,
      },
      S2: {
        stationId: 'S2',
        avgEmptyEpisodeMinutes: 30,
        avgFullEpisodeMinutes: 30,
        maxEmptyEpisodeMinutes: 180,
        maxFullEpisodeMinutes: 180,
        episodeCount: 1,
      },
      S3: {
        stationId: 'S3',
        avgEmptyEpisodeMinutes: 0,
        avgFullEpisodeMinutes: 0,
        maxEmptyEpisodeMinutes: 0,
        maxFullEpisodeMinutes: 0,
        episodeCount: 0,
      },
    };

    expect(mapCriticalEpisodes(episodes, new Map([['S1', 'Delicias']]))).toEqual([
      {
        stationId: 'S1',
        stationName: 'Delicias',
        kind: 'full',
        maxMinutes: 220,
      },
      { stationId: 'S2', stationName: 'S2', kind: 'empty', maxMinutes: 180 },
    ]);
  });

  it('drops episodes whose station is no longer in that state', () => {
    const episodes = [
      { stationId: 'S1', stationName: 'Delicias', kind: 'empty' as const, maxMinutes: 220 },
      { stationId: 'S2', stationName: 'Centro', kind: 'full' as const, maxMinutes: 180 },
      { stationId: 'S3', stationName: 'Universidad', kind: 'empty' as const, maxMinutes: 200 },
    ];
    const stations = [
      { id: 'S1', name: 'Delicias', capacity: 20, bikesAvailable: 5, anchorsFree: 15 },
      { id: 'S2', name: 'Centro', capacity: 20, bikesAvailable: 10, anchorsFree: 0 },
      { id: 'S3', name: 'Universidad', capacity: 20, bikesAvailable: 0, anchorsFree: 20 },
    ];

    expect(filterCurrentEpisodes(episodes, stations)).toEqual([
      episodes[1],
      episodes[2],
    ]);
  });

  it('drops episodes for stations that are no longer present', () => {
    const episodes = [
      { stationId: 'S9', stationName: 'S9', kind: 'empty' as const, maxMinutes: 220 },
    ];

    expect(filterCurrentEpisodes(episodes, [])).toEqual([]);
  });
});

describe('hourly anomaly mapping', () => {
  it('maps baseline rows and only accepts upward anomalies', () => {
    const rows: HourlyNetworkActivityBaselineRow[] = [
      { isoWeekday: 2, hour: 7, bucketStart: '2026-08-04T05:00:00.000Z', activityIndex: 100, sampleCount: 1 },
    ];
    expect(mapHourlyActivitySamples(rows)).toEqual([
      { weekday: 2, hour: 7, activityIndex: 100 },
    ]);

    const anomaly: RobustAnomaly = {
      value: 400,
      baseline: 100,
      mad: 5,
      zScore: 40,
      deviationRatio: 3,
      isAnomaly: true,
      direction: 'up',
      method: 'mad',
    };

    expect(mapAfternoonAnomaly({ anomaly, weekday: 2, hour: 7 })).toEqual({
      weekday: 2,
      hour: 7,
      value: 400,
      baseline: 100,
      deviationRatio: 3,
      zScore: 40,
      direction: 'up',
      isAnomaly: true,
    });

    expect(
      mapAfternoonAnomaly({
        anomaly: { ...anomaly, direction: 'down' },
        weekday: 2,
        hour: 7,
      })
    ).toBeNull();
    expect(
      mapAfternoonAnomaly({
        anomaly: { ...anomaly, isAnomaly: false },
        weekday: 2,
        hour: 7,
      })
    ).toBeNull();
    expect(mapAfternoonAnomaly({ anomaly: null, weekday: 2, hour: 7 })).toBeNull();
  });
});

describe('network and cause mapping', () => {
  it('maps network health without losing the citizen label or counts', () => {
    const health: NetworkHealth = {
      level: 'yellow',
      label: 'Red con tensión',
      description: '2 de 10 estaciones sin bicis o huecos (20%).',
      unavailableShare: 0.2,
      criticalStationsCount: 2,
      totalStations: 10,
    };

    expect(mapNetworkHealth(health)).toEqual({
      level: 'yellow',
      label: 'Red con tensión',
      description: '2 de 10 estaciones sin bicis o huecos (20%).',
      criticalStationsCount: 2,
      totalStations: 10,
      unavailableShare: 0.2,
    });
  });

  it('maps a curated cause and ignores empty labels', () => {
    const cause: ServiceCause = { kind: 'holiday', label: 'Fiestas del Pilar' };
    expect(mapServiceCause(cause)).toEqual({
      label: 'Fiestas del Pilar',
      kind: 'holiday',
    });
    expect(mapServiceCause({ kind: 'event', label: '  ' })).toBeNull();
    expect(mapServiceCause(null)).toBeNull();
  });
});
