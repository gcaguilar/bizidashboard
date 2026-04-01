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
        recordedAt: new Date('2026-04-01T14:35:00.000Z').toISOString(),
      },
      {
        id: '102',
        name: 'Paraninfo',
        bikesAvailable: 4,
        capacity: 18,
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
            recordedAt: new Date('2026-04-01T14:35:00.000Z'),
          },
          {
            id: '102',
            name: 'Paraninfo',
            bikesAvailable: 4,
            capacity: 18,
            recordedAt: '2026-04-01T14:30:00.000Z',
          },
        ],
      })
    );

    expect(interactive.defaultDimensionId).toBe('stations');
    expect(interactive.dimensions[0]?.options[0]?.note).toContain('Ultima muestra');
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
});
