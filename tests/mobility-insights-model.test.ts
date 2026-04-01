import { describe, expect, it } from 'vitest';
import {
  buildChordLinks,
  buildChordNodes,
  buildDailyCurveData,
  buildPeriodInsights,
  buildTopEmitterTowardReference,
  buildTopReceiverFromReference,
  buildTopRoutes,
  isMobilityResponse,
  resolvePeriod,
} from '@/app/dashboard/_components/mobility-insights-model';

const mobilityData = {
  mobilityDays: 14,
  demandDays: 30,
  methodology: 'metodo',
  generatedAt: '2026-04-01T14:35:00.000Z',
  hourlySignals: [
    { stationId: 's1', hour: 8, departures: 10, arrivals: 2, sampleCount: 8 },
    { stationId: 's2', hour: 8, departures: 1, arrivals: 9, sampleCount: 8 },
    { stationId: 's1', hour: 18, departures: 3, arrivals: 4, sampleCount: 8 },
    { stationId: 's3', hour: 18, departures: 2, arrivals: 5, sampleCount: 8 },
  ],
  dailyDemand: [
    { day: '2026-04-01', demandScore: 100, avgOccupancy: 0.52, sampleCount: 40 },
    { day: '2026-04-02', demandScore: 120, avgOccupancy: 0.49, sampleCount: 42 },
  ],
};

describe('mobility insights model', () => {
  it('validates mobility payload shapes', () => {
    expect(isMobilityResponse(mobilityData)).toBe(true);
    expect(isMobilityResponse({ hourlySignals: [] })).toBe(false);
  });

  it('builds period insights and top routes from district-mapped signals', () => {
    const stationDistrictMap = new Map([
      ['s1', 'Centro'],
      ['s2', 'Romareda'],
      ['s3', 'Delicias'],
    ]);

    const insights = buildPeriodInsights(mobilityData, stationDistrictMap);
    const active = insights.find((item) => item.key === 'morning');
    const topRoutes = buildTopRoutes(active);

    expect(active?.districts.map((row) => row.district)).toEqual(['Centro', 'Romareda']);
    expect(topRoutes[0]).toEqual({ origin: 'Centro', destination: 'Romareda', flow: 9 });
  });

  it('derives reference district flows and chord artifacts', () => {
    const stationDistrictMap = new Map([
      ['s1', 'Centro'],
      ['s2', 'Romareda'],
      ['s3', 'Delicias'],
    ]);
    const active = buildPeriodInsights(mobilityData, stationDistrictMap).find(
      (item) => item.key === 'all'
    );
    const chordNodes = buildChordNodes(active);
    const chordLinks = buildChordLinks(chordNodes, buildTopRoutes(active));

    expect(buildTopEmitterTowardReference(active, 'Romareda')).toEqual({
      district: 'Centro',
      flow: 9,
    });
    expect(buildTopReceiverFromReference(active, 'Centro')).toEqual({
      district: 'Romareda',
      flow: 9,
    });
    expect(chordNodes).toHaveLength(3);
    expect(chordLinks.length).toBeGreaterThan(0);
  });

  it('formats daily curve rows and resolves periods safely', () => {
    expect(buildDailyCurveData(mobilityData)).toEqual([
      {
        day: '2026-04-01',
        label: '01/04',
        demandScore: 100,
        avgOccupancyRatio: 0.52,
      },
      {
        day: '2026-04-02',
        label: '02/04',
        demandScore: 120,
        avgOccupancyRatio: 0.49,
      },
    ]);
    expect(resolvePeriod('midday')).toBe('midday');
    expect(resolvePeriod('invalid')).toBe('all');
  });
});
