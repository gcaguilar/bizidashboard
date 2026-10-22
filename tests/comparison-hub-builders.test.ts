import { describe, expect, it } from 'vitest';
import {
  buildComparisonHubViewModel,
  buildFallbackComparisonSections,
  type ComparisonHubViewModelInput,
} from '@/lib/comparison-hub-builders';

function buildInput(
  overrides: Partial<ComparisonHubViewModelInput> = {}
): ComparisonHubViewModelInput {
  return {
    stations: [
      {
        id: '101',
        name: 'Plaza Espana',
        bikesAvailable: 9,
        capacity: 20,
        anchorsFree: 11,
        lat: 41.65,
        lon: -0.88,
        recordedAt: new Date('2026-04-01T14:35:00.000Z').toISOString(),
      },
      {
        id: '102',
        name: 'Paraninfo',
        bikesAvailable: 4,
        capacity: 18,
        anchorsFree: 14,
        lat: 41.66,
        lon: -0.89,
        recordedAt: new Date('2026-04-01T14:30:00.000Z').toISOString(),
      },
    ],
    turnoverRankings: [
      { stationId: '101', turnoverScore: 12.4 },
      { stationId: '102', turnoverScore: 9.2 },
    ],
    availabilityRankings: [
      { stationId: '101', emptyHours: 1.2, fullHours: 0.8 },
      { stationId: '102', emptyHours: 2.1, fullHours: 0.4 },
    ],
    districtRows: [
      {
        slug: 'centro',
        name: 'Centro',
        stationCount: 2,
        bikesAvailable: 13,
        anchorsFree: 25,
        capacity: 38,
        avgTurnover: 10.8,
        avgAvailabilityRisk: 2.3,
        topStations: [],
      },
      {
        slug: 'romareda',
        name: 'Romareda',
        stationCount: 1,
        bikesAvailable: 6,
        anchorsFree: 12,
        capacity: 18,
        avgTurnover: 4.1,
        avgAvailabilityRisk: 1.1,
        topStations: [],
      },
    ],
    monthlySeries: [
      {
        monthKey: '2026-02',
        demandScore: 1000,
        avgOccupancy: 0.48,
        activeStations: 270,
        sampleCount: 900,
      },
      {
        monthKey: '2026-03',
        demandScore: 1200,
        avgOccupancy: 0.52,
        activeStations: 276,
        sampleCount: 950,
      },
    ],
    recentDemand: Array.from({ length: 40 }).map((_, index) => ({
      day: new Date(Date.UTC(2026, 1, index + 1)).toISOString().slice(0, 10),
      demandScore: 100 + index,
      avgOccupancy: 0.4 + index * 0.001,
      sampleCount: 50 + index,
    })),
    hourlyProfile: [
      { hour: 8, avgOccupancy: 0.38, avgBikesAvailable: 5, sampleCount: 100 },
      { hour: 18, avgOccupancy: 0.72, avgBikesAvailable: 12, sampleCount: 100 },
    ],
    historyRows: Array.from({ length: 14 }).map((_, index) => ({
      day: `2026-03-${String(index + 1).padStart(2, '0')}`,
      demandScore: 80 + index,
      avgOccupancy: 0.45,
      balanceIndex: 0.75 + index * 0.002,
      sampleCount: 60 + index,
    })),
    datasetCoverageDays: 90,
    stationHourlyProfiles: [],
    stationDailyDemand: [],
    stationDistricts: [],
    cityName: 'Zaragoza',
    comparisonNow: '2026-04-01T14:35:00.000Z',
    latestMonth: '2026-03',
    previousMonth: '2026-02',
    recentPayload: {
      dateKey: '2026-04-01',
      generatedAt: '2026-04-01T14:35:00.000Z',
      selectedMonth: null,
      sourceFirstDay: '2026-01-01',
      sourceLastDay: '2026-03-31',
      totalHistoricalDays: 90,
      stationsWithData: 276,
      activeStations: 276,
      metrics: {
        demandLast7Days: 700,
        demandPrevious7Days: 650,
        demandDeltaRatio: 0.08,
        occupancyLast7Days: 0.51,
        occupancyPrevious7Days: 0.49,
        occupancyDeltaRatio: 0.04,
      },
      summary: 'Resumen',
      highlights: [],
      recommendations: [],
      peakDemandHours: [],
      topDistrictsByDemand: [],
      topStationsByDemand: [
        { stationId: '101', stationName: 'Plaza Espana', avgDemand: 14.2 },
        { stationId: '102', stationName: 'Paraninfo', avgDemand: 11.1 },
      ],
      leastUsedStations: [],
      weekdayWeekendProfile: {
        weekday: { avgDemand: 120, avgOccupancy: 0.52, daysCount: 5 },
        weekend: { avgDemand: 95, avgOccupancy: 0.47, daysCount: 2 },
        demandGapRatio: 0.26,
        dominantPeriod: 'weekday',
      },
    },
    latestMonthPayload: {
      dateKey: '2026-03-31',
      generatedAt: '2026-03-31T23:59:00.000Z',
      selectedMonth: '2026-03',
      sourceFirstDay: '2026-03-01',
      sourceLastDay: '2026-03-31',
      totalHistoricalDays: 31,
      stationsWithData: 276,
      activeStations: 276,
      metrics: {
        demandLast7Days: 700,
        demandPrevious7Days: 650,
        demandDeltaRatio: 0.08,
        occupancyLast7Days: 0.51,
        occupancyPrevious7Days: 0.49,
        occupancyDeltaRatio: 0.04,
      },
      summary: 'Marzo',
      highlights: [],
      recommendations: [],
      peakDemandHours: [],
      topDistrictsByDemand: [],
      topStationsByDemand: [
        { stationId: '101', stationName: 'Plaza Espana', avgDemand: 14.2 },
        { stationId: '102', stationName: 'Paraninfo', avgDemand: 11.1 },
      ],
      leastUsedStations: [],
      weekdayWeekendProfile: {
        weekday: { avgDemand: 120, avgOccupancy: 0.52, daysCount: 5 },
        weekend: { avgDemand: 95, avgOccupancy: 0.47, daysCount: 2 },
        demandGapRatio: 0.26,
        dominantPeriod: 'weekday',
      },
    },
    previousMonthPayload: {
      dateKey: '2026-02-28',
      generatedAt: '2026-02-28T23:59:00.000Z',
      selectedMonth: '2026-02',
      sourceFirstDay: '2026-02-01',
      sourceLastDay: '2026-02-28',
      totalHistoricalDays: 28,
      stationsWithData: 270,
      activeStations: 270,
      metrics: {
        demandLast7Days: 620,
        demandPrevious7Days: 610,
        demandDeltaRatio: 0.02,
        occupancyLast7Days: 0.48,
        occupancyPrevious7Days: 0.47,
        occupancyDeltaRatio: 0.02,
      },
      summary: 'Febrero',
      highlights: [],
      recommendations: [],
      peakDemandHours: [],
      topDistrictsByDemand: [],
      topStationsByDemand: [
        { stationId: '102', stationName: 'Paraninfo', avgDemand: 12.2 },
        { stationId: '101', stationName: 'Plaza Espana', avgDemand: 10.9 },
      ],
      leastUsedStations: [],
      weekdayWeekendProfile: {
        weekday: { avgDemand: 110, avgOccupancy: 0.48, daysCount: 5 },
        weekend: { avgDemand: 90, avgOccupancy: 0.45, daysCount: 2 },
        demandGapRatio: 0.22,
        dominantPeriod: 'weekday',
      },
    },
    ...overrides,
  };
}

describe('comparison hub builders', () => {
  it('builds interactive station options with normalized timestamps', () => {
    const { interactive } = buildComparisonHubViewModel(
      buildInput({
        stations: [
          {
            id: '101',
            name: 'Plaza Espana',
            bikesAvailable: 9,
            capacity: 20,
            anchorsFree: 11,
            lat: 41.65,
            lon: -0.88,
            recordedAt: new Date('2026-04-01T14:35:00.000Z'),
          },
          {
            id: '102',
            name: 'Paraninfo',
            bikesAvailable: 4,
            capacity: 18,
            anchorsFree: 14,
            lat: 41.66,
            lon: -0.89,
            recordedAt: '2026-04-01T14:30:00.000Z',
          },
        ],
      })
    );

    expect(interactive.defaultDimensionId).toBe('stations');
    expect(interactive.dimensions[0]?.options[0]?.note).toContain('Última muestra');
    expect(interactive.dimensions[0]?.options[1]?.note).toContain('2026-04-01 14:35');
  });

  it('returns empty interactive state and fallback cards when data is missing', () => {
    const { interactive, sections } = buildComparisonHubViewModel(
      buildInput({
        stations: [],
        turnoverRankings: [],
        availabilityRankings: [],
        districtRows: [],
        monthlySeries: [],
        recentDemand: [],
        hourlyProfile: [],
        historyRows: [],
        recentPayload: null,
        latestMonthPayload: null,
        previousMonthPayload: null,
      })
    );

    expect(interactive.defaultDimensionId).toBeNull();
    expect(interactive.dimensions).toHaveLength(0);
    expect(sections).toHaveLength(3);
    expect(sections[0]?.cards[0]?.delta).toBe('Pendiente de cobertura');
  });

  it('exposes empty fallback sections for no-coverage mode', () => {
    expect(buildFallbackComparisonSections().map((section) => section.cards)).toEqual([
      [],
      [],
      [],
    ]);
  });

  it('normalizes a running month against the same available days of the prior month', () => {
    const { sections } = buildComparisonHubViewModel(
      buildInput({
        comparisonNow: '2026-03-02T12:00:00.000Z',
        monthlySeries: [
          { monthKey: '2026-02', demandScore: 10_000, avgOccupancy: 0.5, activeStations: 276, sampleCount: 10_000 },
          { monthKey: '2026-03', demandScore: 200, avgOccupancy: 0.5, activeStations: 276, sampleCount: 200 },
        ],
        recentDemand: [
          { day: '2026-02-01', demandScore: 100, avgOccupancy: 0.5, sampleCount: 100 },
          { day: '2026-02-02', demandScore: 100, avgOccupancy: 0.5, sampleCount: 100 },
          { day: '2026-03-01', demandScore: 100, avgOccupancy: 0.5, sampleCount: 100 },
          { day: '2026-03-02', demandScore: 100, avgOccupancy: 0.5, sampleCount: 100 },
        ],
      })
    );
    const monthCard = sections.find((section) => section.id === 'historical')?.cards.find((card) => card.id === 'month-vs-month');

    expect(monthCard?.delta).toBe('Movimiento estimado comparable +0%');
    expect(monthCard?.delta).not.toContain('-98%');
    expect(monthCard?.note).toContain('2 de 31 días disponibles');
    expect(monthCard?.temporalComparison).toMatchObject({
      isComparable: true,
      periodLabel: 'mismos días del mes anterior',
    });
  });

  it('withholds a monthly percentage when equivalent reference days are missing', () => {
    const { sections } = buildComparisonHubViewModel(
      buildInput({
        comparisonNow: '2026-03-02T12:00:00.000Z',
        monthlySeries: [
          { monthKey: '2026-02', demandScore: 10_000, avgOccupancy: 0.5, activeStations: 276, sampleCount: 10_000 },
          { monthKey: '2026-03', demandScore: 200, avgOccupancy: 0.5, activeStations: 276, sampleCount: 200 },
        ],
        recentDemand: [
          { day: '2026-02-01', demandScore: 100, avgOccupancy: 0.5, sampleCount: 100 },
          { day: '2026-03-01', demandScore: 100, avgOccupancy: 0.5, sampleCount: 100 },
          { day: '2026-03-02', demandScore: 100, avgOccupancy: 0.5, sampleCount: 100 },
        ],
      })
    );
    const monthCard = sections.find((section) => section.id === 'historical')?.cards.find((card) => card.id === 'month-vs-month');

    expect(monthCard?.delta).toBe('Comparación no disponible todavía');
    expect(monthCard?.temporalComparison?.isComparable).toBe(false);
  });

  it('does not compare an in-progress year with a completed one', () => {
    const complete2025 = Array.from({ length: 12 }, (_, index) => ({
      monthKey: `2025-${String(index + 1).padStart(2, '0')}`,
      demandScore: 1_000,
      avgOccupancy: 0.5,
      activeStations: 270,
      sampleCount: 1_000,
    }));
    const { sections } = buildComparisonHubViewModel(
      buildInput({
        comparisonNow: '2026-03-02T12:00:00.000Z',
        monthlySeries: [
          ...complete2025,
          { monthKey: '2026-01', demandScore: 1_000, avgOccupancy: 0.5, activeStations: 276, sampleCount: 1_000 },
          { monthKey: '2026-02', demandScore: 1_000, avgOccupancy: 0.5, activeStations: 276, sampleCount: 1_000 },
        ],
      })
    );
    const yearCard = sections.find((section) => section.id === 'historical')?.cards.find((card) => card.id === 'year-vs-year');

    expect(yearCard?.delta).toBe('Comparación no disponible todavía');
    expect(yearCard?.note).toContain('2 de 12 meses disponibles en 2026');
  });
});

describe('comparison hub citizen assistant view model', () => {
  function buildDecisionInput(
    overrides: Partial<ComparisonHubViewModelInput> = {}
  ): ComparisonHubViewModelInput {
    return buildInput({
      stationHourlyProfiles: [
        {
          stationId: '101',
          hour: 8,
          avgBikes: 1,
          avgAnchors: 19,
          avgOccupancy: 0.05,
          sampleCount: 10,
          emptyShare: 0.8,
          fullShare: 0,
        },
        {
          stationId: '101',
          hour: 18,
          avgBikes: 12,
          avgAnchors: 8,
          avgOccupancy: 0.6,
          sampleCount: 10,
          emptyShare: 0,
          fullShare: 0,
        },
      ],
      stationDistricts: [
        { stationId: '101', districtSlug: 'centro', districtName: 'Centro' },
        { stationId: '102', districtSlug: 'romareda', districtName: 'Romareda' },
      ],
      stationDailyDemand: Array.from({ length: 14 }, (_, index) => ({
        stationId: '101',
        day: `2026-03-${String(index + 1).padStart(2, '0')}`,
        demandScore: 100 + index,
        avgOccupancy: 0.5,
        sampleCount: 10,
      })),
      ...overrides,
    });
  }

  it('adds traffic-light bands and contextual metrics to station options', () => {
    const { interactive } = buildComparisonHubViewModel(buildDecisionInput());
    const station = interactive.dimensions
      .find((dimension) => dimension.id === 'stations')
      ?.options.find((option) => option.id === '101');

    expect(station?.bands).toHaveLength(6);
    const morningBand = station?.bands?.find((band) => band.id === 'morning');
    const afternoonBand = station?.bands?.find((band) => band.id === 'afternoon');
    expect(morningBand?.status).toBe('red');
    expect(morningBand?.peakHour).toBe(8);
    expect(afternoonBand?.status).toBe('green');
    expect(station?.metrics?.map((metric) => metric.key)).toEqual([
      'bikes',
      'anchors',
      'availability',
      'tension',
    ]);
    expect(station?.reliabilityScore).not.toBeNull();
  });

  it('offers the city average as a district comparison option', () => {
    const { interactive } = buildComparisonHubViewModel(buildDecisionInput());
    const districtOptions =
      interactive.dimensions.find((dimension) => dimension.id === 'districts')?.options ?? [];

    expect(districtOptions.some((option) => option.kind === 'city-average')).toBe(true);
  });

  it('builds one-click presets for the citizen questions', () => {
    const { interactive } = buildComparisonHubViewModel(buildDecisionInput());
    const ids = interactive.presets.map((preset) => preset.id);

    expect(ids).toEqual([
      'nearest-alternative',
      'district-vs-city',
      'today-vs-last-week',
      'saved-stations',
    ]);
    expect(
      interactive.presets.find((preset) => preset.id === 'district-vs-city')?.rightId
    ).toBe('city-average');
  });

  it('builds period scopes per city and district from station daily demand', () => {
    const { interactive } = buildComparisonHubViewModel(buildDecisionInput());
    const periods = interactive.dimensions.find((dimension) => dimension.id === 'periods');
    const cityScope = periods?.scopes?.find((scope) => scope.id === 'city');

    expect(periods?.primary).toBe(true);
    expect(cityScope?.options.some((option) => option.id === 'today')).toBe(true);
    expect(cityScope?.options.some((option) => option.id === 'same-weekday-last-week')).toBe(true);
    expect(periods?.scopes?.some((scope) => scope.id === 'centro')).toBe(true);
  });
});
