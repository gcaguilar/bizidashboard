import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
// El cache es irrelevante para el ensamblado: se ejecuta el fetcher directamente.
vi.mock('@/lib/cache/cache', () => ({
  withCache: <T,>(_key: string, _ttl: number, fetcher: () => Promise<T>) => fetcher(),
}));

import { formatDateLabel } from '@/lib/format';
import { buildMonthlyReport } from '@/lib/monthly-report';
import type {
  DailyDemandSeriesRow,
  MonthlyReportSources,
  StationWithLatestStatus,
} from '@/lib/monthly-report-sources';
import type { DistrictCollection } from '@/lib/districts';
import type { MonthlyStationMetricRow } from '@/lib/monthly-report-types';

function metric(
  overrides: Partial<MonthlyStationMetricRow> & { stationId: string }
): MonthlyStationMetricRow {
  return {
    demandScore: 0,
    avgOccupancy: 0.5,
    emptyHours: 0,
    fullHours: 0,
    totalHours: 100,
    activeDays: 30,
    morningEmptyHours: 0,
    morningFullHours: 0,
    morningHours: 0,
    ...overrides,
  };
}

function station(
  overrides: Partial<StationWithLatestStatus> & { id: string }
): StationWithLatestStatus {
  return {
    name: overrides.id,
    lat: 0.5,
    lon: 0.5,
    capacity: 20,
    bikesAvailable: 10,
    anchorsFree: 10,
    recordedAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  };
}

function districtCollection(
  entries: Array<{ distrito: string; min: number; max: number }>
): DistrictCollection {
  return {
    type: 'FeatureCollection',
    features: entries.map((entry) => ({
      type: 'Feature',
      properties: { distrito: entry.distrito },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [entry.min, entry.min],
            [entry.max, entry.min],
            [entry.max, entry.max],
            [entry.min, entry.max],
            [entry.min, entry.min],
          ],
        ],
      },
    })),
  };
}

function buildFixtureSources(
  overrides: Partial<MonthlyReportSources> = {}
): MonthlyReportSources {
  return {
    loadMonthlySeries: async () => [],
    loadDailyCurve: async () => [],
    loadHourlyProfile: async () => [],
    loadConclusions: async () => {
      throw new Error('conclusions unavailable');
    },
    loadStationMetrics: async () => [],
    loadEpisodes: async () => ({}),
    loadHeatmap: async () => [],
    loadStations: async () => [],
    loadDistricts: async () => null,
    ...overrides,
  };
}

const NOW = '2026-04-01T00:00:00.000Z';
const MONTH = '2026-03';

describe('buildMonthlyReport assembly', () => {
  it('ranks undersupplied districts by friction rate before the conclusions read them', async () => {
    const stations = [
      station({ id: 'high', lon: 0.5, lat: 0.5 }),
      station({ id: 'low', lon: 2.5, lat: 2.5 }),
    ];
    const sources = buildFixtureSources({
      loadStations: async () => stations,
      loadDistricts: async () =>
        districtCollection([
          { distrito: 'Alto', min: 0, max: 1 },
          { distrito: 'Bajo', min: 2, max: 3 },
        ]),
      loadStationMetrics: async () => [
        metric({ stationId: 'high', demandScore: 500, totalHours: 100, emptyHours: 40, fullHours: 40 }),
        metric({ stationId: 'low', demandScore: 100, totalHours: 100, emptyHours: 5, fullHours: 5 }),
      ],
    });

    const report = await buildMonthlyReport(MONTH, NOW, sources);

    expect(report.districts.undersupplied.map((district) => district.district)).toEqual([
      'Alto',
      'Bajo',
    ]);
    expect(report.monthlyConclusions[0]).toContain('Alto');
    expect(report.monthlyConclusions[0]).not.toContain('Bajo');
  });

  it('hands the biggest anomaly to the conclusions first', async () => {
    const current: DailyDemandSeriesRow[] = [
      { day: '2026-03-02', demandScore: 100, avgOccupancy: 0.5, sampleCount: 10 },
      { day: '2026-03-03', demandScore: 100, avgOccupancy: 0.5, sampleCount: 10 },
      { day: '2026-03-04', demandScore: 100, avgOccupancy: 0.5, sampleCount: 10 },
      { day: '2026-03-05', demandScore: 400, avgOccupancy: 0.5, sampleCount: 10 },
      { day: '2026-03-06', demandScore: 100, avgOccupancy: 0.5, sampleCount: 10 },
      { day: '2026-03-07', demandScore: 10, avgOccupancy: 0.5, sampleCount: 10 },
    ];
    const sources = buildFixtureSources({
      loadDailyCurve: async (_days, monthKey) => (monthKey === MONTH ? current : []),
    });

    const report = await buildMonthlyReport(MONTH, NOW, sources);

    expect(report.anomalies.length).toBeGreaterThanOrEqual(2);
    const biggest = report.anomalies[0]!;
    const smallest = report.anomalies[report.anomalies.length - 1]!;
    const anomalyConclusion = report.monthlyConclusions.find((line) =>
      line.includes('día más atípico')
    );

    expect(anomalyConclusion).toContain(formatDateLabel(biggest.day));
    expect(anomalyConclusion).not.toContain(formatDateLabel(smallest.day));
  });

  it('reads the trend threshold off the normalized demand ratio', async () => {
    const run = async (currentDemand: number[], referenceDays: string[]) => {
      const current: DailyDemandSeriesRow[] = currentDemand.map((demandScore, index) => ({
        day: `${MONTH}-0${index + 1}`,
        demandScore,
        avgOccupancy: 0.5,
        sampleCount: 10,
      }));
      const reference: DailyDemandSeriesRow[] = referenceDays.map((day) => ({
        day,
        demandScore: 100,
        avgOccupancy: 0.5,
        sampleCount: 10,
      }));
      const sources = buildFixtureSources({
        loadDailyCurve: async (_days, monthKey) =>
          monthKey === MONTH ? current : monthKey === '2026-02' ? reference : [],
      });

      return buildMonthlyReport(MONTH, '2026-03-06T00:00:00.000Z', sources);
    };

    const matched = ['2026-02-01', '2026-02-02', '2026-02-03'];

    expect((await run([120, 120, 120], matched)).comparison.trend).toBe('mejora');
    expect((await run([90, 90, 90], matched)).comparison.trend).toBe('empeora');
    expect((await run([100, 100, 100], matched)).comparison.trend).toBe('estable');
    expect(
      (await run([120, 120, 120], ['2026-02-10', '2026-02-11', '2026-02-12'])).comparison.trend
    ).toBe('sin-datos');
  });

  it('fails the whole report when the monthly series rejects', async () => {
    const sources = buildFixtureSources({
      loadMonthlySeries: async () => {
        throw new Error('series down');
      },
    });

    await expect(buildMonthlyReport(MONTH, NOW, sources)).rejects.toThrow(
      'La serie mensual no está disponible.'
    );
  });

  it('degrades per source and still returns a well formed report', async () => {
    const sources = buildFixtureSources({
      loadHeatmap: async () => {
        throw new Error('heatmap down');
      },
      loadEpisodes: async () => {
        throw new Error('episodes down');
      },
      loadStations: async () => {
        throw new Error('stations down');
      },
      loadDistricts: async () => {
        throw new Error('districts down');
      },
    });

    const report = await buildMonthlyReport(MONTH, NOW, sources);

    expect(report.heatmap).toEqual([]);
    expect(report.problemSpots).toEqual({
      worstFriction: [],
      worstMorning: [],
      longestEpisodes: [],
    });
    expect(report.districts.mostActive).toEqual([]);
    expect(report.monthKey).toBe(MONTH);
  });

  it('falls back to the station count when the month has no series row', async () => {
    const sources = buildFixtureSources({
      loadMonthlySeries: async () => [],
      loadStationMetrics: async () => [
        metric({ stationId: 'a' }),
        metric({ stationId: 'b' }),
        metric({ stationId: 'a' }),
      ],
    });

    const report = await buildMonthlyReport(MONTH, NOW, sources);

    expect(report.hasReport).toBe(false);
    expect(report.headline.activeStations).toBe(2);
  });
});
