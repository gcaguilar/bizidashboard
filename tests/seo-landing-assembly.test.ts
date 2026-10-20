import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getSeoLandingPageData } from '@/lib/seo-landing.server';
import type { SeoLandingSources } from '@/lib/seo-landing-sources.server';
import type { DistrictSeoRow } from '@/lib/seo-districts';
import type { MobilityConclusionsPayload } from '@/lib/mobility-conclusions';
import type { EnrichedRankingRow, RankingsResponse } from '@/lib/api-types';

const NOW = '2026-06-01T12:00:00.000Z';

function makeStations() {
  return {
    generatedAt: NOW,
    dataState: 'ok' as const,
    // Dos va llena (20/20), Uno a medio (5/10) y Tres no declara capacidad.
    stations: [
      { id: '1', name: 'Uno', lat: 41.6, lon: -0.9, capacity: 10, bikesAvailable: 5, anchorsFree: 5, recordedAt: NOW },
      { id: '2', name: 'Dos', lat: 41.6, lon: -0.9, capacity: 20, bikesAvailable: 20, anchorsFree: 0, recordedAt: NOW },
      { id: '3', name: 'Tres', lat: 41.6, lon: -0.9, capacity: 0, bikesAvailable: 0, anchorsFree: 0, recordedAt: NOW },
    ],
  };
}

function makeRankingRow(overrides: Partial<EnrichedRankingRow> = {}): EnrichedRankingRow {
  return {
    id: 1,
    stationId: '2',
    turnoverScore: 42,
    emptyHours: 1,
    fullHours: 2,
    totalHours: 24,
    windowStart: NOW,
    windowEnd: NOW,
    stationName: 'Dos',
    districtName: 'Centro',
    problemHours: 3,
    emptyHourShare: 0.1,
    demandVsStressedHint: 'poco_estres_disponibilidad',
    peakFullHours: [],
    ...overrides,
  };
}

function makeRankings(
  type: RankingsResponse['type'],
  limit: number,
  rankings: EnrichedRankingRow[] = []
): RankingsResponse {
  return { type, limit, rankings, districtSpotlight: [], generatedAt: NOW, dataState: 'ok' };
}

function makeDistrict(overrides: Partial<DistrictSeoRow> = {}): DistrictSeoRow {
  return {
    slug: 'centro',
    name: 'Centro',
    stationCount: 4,
    bikesAvailable: 12,
    anchorsFree: 30,
    capacity: 40,
    avgTurnover: 8.5,
    avgAvailabilityRisk: 0.2,
    topStations: [],
    ...overrides,
  };
}

function makePayload(): MobilityConclusionsPayload {
  return {
    dateKey: '2026-06-01',
    generatedAt: NOW,
    selectedMonth: null,
    sourceFirstDay: '2026-05-01',
    sourceLastDay: '2026-05-31',
    totalHistoricalDays: 31,
    stationsWithData: 2,
    activeStations: 3,
    metrics: {
      demandLast7Days: 10,
      demandPrevious7Days: 8,
      demandDeltaRatio: 0.25,
      occupancyLast7Days: 0.5,
      occupancyPrevious7Days: 0.4,
      occupancyDeltaRatio: 0.25,
    },
    summary: 'Resumen del briefing',
    highlights: [],
    recommendations: [],
    peakDemandHours: [],
    topDistrictsByDemand: [],
    topStationsByDemand: [{ stationId: '2', stationName: 'Dos', avgDemand: 12.5 }],
    leastUsedStations: [{ stationId: '3', stationName: 'Tres', avgDemand: 0.5 }],
    weekdayWeekendProfile: {
      weekday: { avgDemand: 0, avgOccupancy: 0 },
      weekend: { avgDemand: 0, avgOccupancy: 0 },
    },
  } as unknown as MobilityConclusionsPayload;
}

function createFixtureSources(
  calls: string[],
  overrides: Partial<SeoLandingSources> = {}
): SeoLandingSources {
  return {
    async loadStations() {
      calls.push('stations');
      return makeStations();
    },
    async loadRankings(type, limit) {
      calls.push(`rankings:${type}:${limit}`);
      return makeRankings(type, limit);
    },
    async loadDistrictRows() {
      calls.push('districts');
      return [];
    },
    async loadHourlyProfile(days) {
      calls.push(`hourly:${days}`);
      return [];
    },
    async loadDailySeries(days) {
      calls.push(`daily:${days}`);
      return [];
    },
    async loadMonthlySeries(limitMonths) {
      calls.push(`monthly:${limitMonths}`);
      return [];
    },
    async loadRecentConclusions() {
      calls.push('conclusions');
      return null;
    },
    async loadAvailableMonths() {
      calls.push('months');
      return { months: [], generatedAt: NOW };
    },
    async loadAvailabilitySummary(days) {
      calls.push(`rebalancing-summary:${days}`);
      return null;
    },
    ...overrides,
  };
}

describe('SEO landing content assembly', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });

  it('builds the most-bikes landing from the stations fixture alone', async () => {
    const calls: string[] = [];

    const data = await getSeoLandingPageData(
      'estaciones-con-mas-bicis',
      createFixtureSources(calls)
    );

    expect(calls).toEqual(['stations']);
    expect(data.content.sectionItems.map((item) => item.title)).toEqual([
      '1. Dos',
      '2. Uno',
      '3. Tres',
    ]);
    expect(data.content.stats.map((stat) => stat.value)).toEqual(['3', '25', '20']);
  });

  it('ranks stations from the rankings fixture and reads bikes off the stations fixture', async () => {
    const calls: string[] = [];

    const data = await getSeoLandingPageData(
      'estaciones-mas-usadas-zaragoza',
      createFixtureSources(calls, {
        async loadRankings(type, limit) {
          calls.push(`rankings:${type}:${limit}`);
          return makeRankings(type, limit, [makeRankingRow({ stationId: '2', turnoverScore: 42 })]);
        },
      })
    );

    expect(calls).toEqual(['stations', 'rankings:turnover:12']);
    expect(data.content.sectionItems[0]?.title).toBe('1. Dos');
    expect(data.content.sectionItems[0]?.detail).toContain('42 puntos');
    expect(data.content.stats[1]?.value).toBe('42 pts');
  });

  it('falls back to the stations snapshot when the rankings fixture is empty', async () => {
    const calls: string[] = [];

    const data = await getSeoLandingPageData(
      'ranking-estaciones-bizi',
      createFixtureSources(calls)
    );

    expect(calls).toEqual(['stations', 'rankings:turnover:6', 'rankings:availability:6']);
    expect(data.content.sectionTitle).toBe('Estaciones ordenadas por disponibilidad actual');
    expect(data.content.sectionItems[0]?.title).toBe('1. Dos');
  });

  it('builds the districts landing from the district fixture', async () => {
    const calls: string[] = [];

    const data = await getSeoLandingPageData(
      'barrios-bizi-zaragoza',
      createFixtureSources(calls, {
        async loadDistrictRows() {
          calls.push('districts');
          return [makeDistrict()];
        },
      })
    );

    expect(calls).toEqual(['districts']);
    expect(data.content.sectionItems[0]?.title).toBe('1. Centro');
    expect(data.content.stats.map((stat) => stat.value)).toEqual(['1', '4', '12']);
  });

  it('builds the station usage landing from the conclusions fixture', async () => {
    const calls: string[] = [];

    const data = await getSeoLandingPageData(
      'uso-bizi-por-estacion',
      createFixtureSources(calls, {
        async loadRecentConclusions() {
          calls.push('conclusions');
          return makePayload();
        },
      })
    );

    expect(calls).toEqual(['conclusions']);
    expect(data.content.sectionItems.map((item) => item.title)).toEqual([
      'Alta demanda 1. Dos',
      'Menor uso 1. Tres',
    ]);
  });

  it('builds redistribucion from the availability summary fixture', async () => {
    const calls: string[] = [];

    const data = await getSeoLandingPageData(
      'redistribucion',
      createFixtureSources(calls, {
        async loadAvailabilitySummary(days) {
          calls.push(`rebalancing-summary:${days}`);
          return {
            stationCount: 130,
            pctTimeEmpty: 0.12,
            pctTimeFull: 0.08,
            generatedAt: '2026-04-01T10:00:00.000Z',
          };
        },
      })
    );

    expect(calls).toEqual(['rebalancing-summary:15']);
    expect(data.content.generatedAt).toBe('2026-04-01T10:00:00.000Z');
    expect(data.content.stats.map((stat) => stat.value)).toEqual(['130', '12%', '8%']);
  });

  it('degrades redistribucion to the stations snapshot when the summary fixture is absent', async () => {
    const calls: string[] = [];

    const data = await getSeoLandingPageData('redistribucion', createFixtureSources(calls));

    expect(calls).toEqual(['rebalancing-summary:15', 'stations']);
    // Ocupacion media = (5/10 + 20/20) / 2 = 0.75 (solo estaciones con capacidad).
    expect(data.content.stats.map((stat) => stat.value)).toEqual(['3', '25%', '75%']);
    expect(data.content.generatedAt).toBe(NOW);
  });
});
