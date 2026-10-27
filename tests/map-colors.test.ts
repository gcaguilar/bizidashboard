import { describe, expect, it } from 'vitest';
import type { StationSnapshot } from '@/lib/api-types';
import {
  ANALYTICAL_MAP_LEGEND,
  CITIZEN_MAP_LEGEND,
  getAnalyticalMarkerColor,
  getAnalyticalMarkerSeverity,
  getCitizenMarkerColor,
  getCitizenMarkerSeverity,
  getCitizenStatusDetail,
} from '@/lib/map-colors';

function buildStation(overrides: Partial<StationSnapshot> = {}): StationSnapshot {
  return {
    id: '101',
    name: 'Station 101',
    lat: 41.65,
    lon: -0.88,
    capacity: 20,
    bikesAvailable: 10,
    anchorsFree: 10,
    recordedAt: '2026-04-01T11:59:00.000Z',
    ...overrides,
  };
}

describe('getCitizenMarkerColor', () => {
  it('marks stations without capacity as unknown grey', () => {
    expect(getCitizenMarkerColor(buildStation({ capacity: 0 }))).toBe('#64748b');
    expect(getCitizenMarkerColor(buildStation({ capacity: 0, bikesAvailable: 10, anchorsFree: 10 }))).toBe('#64748b');
  });

  it('marks saturated stations without bikes or without anchors as red', () => {
    expect(getCitizenMarkerColor(buildStation({ bikesAvailable: 0 }))).toBe('#b91c1c');
    expect(getCitizenMarkerColor(buildStation({ anchorsFree: 0 }))).toBe('#b91c1c');
  });

  it('marks stations below 3 bikes or below 3 anchors as orange', () => {
    expect(getCitizenMarkerColor(buildStation({ bikesAvailable: 1, anchorsFree: 10 }))).toBe('#b45309');
    expect(getCitizenMarkerColor(buildStation({ bikesAvailable: 2, anchorsFree: 10 }))).toBe('#b45309');
    expect(getCitizenMarkerColor(buildStation({ bikesAvailable: 10, anchorsFree: 2 }))).toBe('#b45309');
  });

  it('marks stations with 3 or more bikes and anchors as green', () => {
    expect(getCitizenMarkerColor(buildStation({ bikesAvailable: 3, anchorsFree: 3 }))).toBe('#0f766e');
    expect(getCitizenMarkerColor(buildStation({ bikesAvailable: 10, anchorsFree: 3 }))).toBe('#0f766e');
    expect(getCitizenMarkerColor(buildStation({ bikesAvailable: 10, anchorsFree: 10 }))).toBe('#0f766e');
  });
});

describe('getAnalyticalMarkerColor', () => {
  it('keeps the exact thresholds of the original dashboard marker color', () => {
    expect(getAnalyticalMarkerColor(buildStation({ capacity: 0 }))).toBe('#64748b');
    expect(getAnalyticalMarkerColor(buildStation({ bikesAvailable: 0, anchorsFree: 0 }))).toBe('#991b1b');
    expect(getAnalyticalMarkerColor(buildStation({ bikesAvailable: 0, anchorsFree: 5 }))).toBe('#7c2d12');
    expect(getAnalyticalMarkerColor(buildStation({ bikesAvailable: 12, anchorsFree: 8 }))).toBe('#0f766e');
    expect(getAnalyticalMarkerColor(buildStation({ bikesAvailable: 11, anchorsFree: 9 }))).toBe('#b45309');
    expect(getAnalyticalMarkerColor(buildStation({ bikesAvailable: 8, anchorsFree: 12 }))).toBe('#b45309');
    expect(getAnalyticalMarkerColor(buildStation({ bikesAvailable: 5, anchorsFree: 15 }))).toBe('#b91c1c');
    expect(getAnalyticalMarkerColor(buildStation({ bikesAvailable: 2, anchorsFree: 18 }))).toBe('#b91c1c');
  });
});

describe('CITIZEN_MAP_LEGEND', () => {
  it('documents the three citizen states from green to red', () => {
    expect(CITIZEN_MAP_LEGEND).toEqual([
      {
        level: 'balanced',
        color: '#0f766e',
        icon: '=',
        label: 'Equilibrio',
        description: '3 o más bicis y 3 o más huecos',
      },
      {
        level: 'low',
        color: '#b45309',
        icon: '!',
        label: 'Poca disponibilidad',
        description: 'menos de 3 bicis o menos de 3 huecos',
      },
      {
        level: 'depleted',
        color: '#b91c1c',
        icon: '×',
        label: 'Agotada',
        description: 'sin bicis o sin huecos',
      },
    ]);
  });
});

describe('marker severity used by the map clusters', () => {
  it('ranks analytical stations from healthy (0) to depleted (3)', () => {
    expect(getAnalyticalMarkerSeverity(buildStation({ capacity: 0 }))).toBe(0);
    expect(getAnalyticalMarkerSeverity(buildStation({ bikesAvailable: 12, anchorsFree: 8 }))).toBe(0);
    expect(getAnalyticalMarkerSeverity(buildStation({ bikesAvailable: 8, anchorsFree: 12 }))).toBe(1);
    expect(getAnalyticalMarkerSeverity(buildStation({ bikesAvailable: 4, anchorsFree: 16 }))).toBe(2);
    expect(getAnalyticalMarkerSeverity(buildStation({ bikesAvailable: 0, anchorsFree: 20 }))).toBe(3);
    expect(getAnalyticalMarkerSeverity(buildStation({ bikesAvailable: 20, anchorsFree: 0 }))).toBe(3);
  });

  it('ranks citizen stations with availability semantics', () => {
    expect(getCitizenMarkerSeverity(buildStation({ capacity: 0 }))).toBe(0);
    expect(getCitizenMarkerSeverity(buildStation({ bikesAvailable: 10, anchorsFree: 10 }))).toBe(0);
    expect(getCitizenMarkerSeverity(buildStation({ bikesAvailable: 2, anchorsFree: 10 }))).toBe(1);
    expect(getCitizenMarkerSeverity(buildStation({ bikesAvailable: 0, anchorsFree: 10 }))).toBe(3);
  });
});

describe('ANALYTICAL_MAP_LEGEND', () => {
  it('covers every analytical marker colour', () => {
    const legendColors = new Set(ANALYTICAL_MAP_LEGEND.map((item) => item.color));

    for (const station of [
      buildStation({ capacity: 0 }),
      buildStation({ bikesAvailable: 0, anchorsFree: 0 }),
      buildStation({ bikesAvailable: 0, anchorsFree: 5 }),
      buildStation({ bikesAvailable: 12, anchorsFree: 8 }),
      buildStation({ bikesAvailable: 8, anchorsFree: 12 }),
      buildStation({ bikesAvailable: 5, anchorsFree: 15 }),
    ]) {
      expect(legendColors.has(getAnalyticalMarkerColor(station))).toBe(true);
    }
  });
});

describe('getCitizenStatusDetail', () => {
  it('keeps the fine vocabulary inside the three citizen levels', () => {
    expect(getCitizenStatusDetail(buildStation({ bikesAvailable: 0 }))).toBe('Sin bicis');
    expect(getCitizenStatusDetail(buildStation({ anchorsFree: 0 }))).toBe('Sin huecos');
    expect(getCitizenStatusDetail(buildStation({ bikesAvailable: 2 }))).toBe('Pocas bicis');
    expect(getCitizenStatusDetail(buildStation({ anchorsFree: 2 }))).toBe('Pocos huecos');
    expect(getCitizenStatusDetail(buildStation())).toBe('Equilibrio');
    expect(getCitizenStatusDetail(buildStation({ capacity: 0 }))).toBe('Sin datos');
  });
});
