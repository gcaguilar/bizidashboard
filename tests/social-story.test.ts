import { describe, expect, it } from 'vitest';

import {
  buildAfternoonStory,
  buildMonthlyCarousel,
  buildMorningStory,
  buildWeeklyCarousel,
} from '@/lib/social/story';
import type {
  SocialDistrictStats,
  SocialNetworkContext,
  SocialStationCandidate,
  SocialStationSelection,
  SocialWeekRange,
} from '@/lib/social/types';
import type { MonthlyReport } from '@/lib/monthly-report-types';

const COMMUTE_TERM = /hora punta|entrada al trabajo|salida del trabajo|desplazamiento|commute/iu;

const network: SocialNetworkContext = {
  level: 'yellow',
  label: 'Afectaciones moderadas',
  criticalStationsCount: 12,
  totalStations: 276,
  unavailableShare: 0.043,
};

const districts: SocialDistrictStats[] = [
  {
    district: 'Centro',
    stationCount: 8,
    activityIndex: 1200,
    previousActivityIndex: 1000,
    growthRatio: 0.2,
    emptyHours: 3,
    fullHours: 2,
    totalHours: 40,
    frictionRate: 0.125,
  },
  {
    district: 'Delicias',
    stationCount: 7,
    activityIndex: 900,
    previousActivityIndex: 850,
    growthRatio: 0.0588,
    emptyHours: 18,
    fullHours: 10,
    totalHours: 70,
    frictionRate: 0.4,
  },
  {
    district: 'Universidad',
    stationCount: 6,
    activityIndex: 600,
    previousActivityIndex: 550,
    growthRatio: 0.0909,
    emptyHours: 2,
    fullHours: 1,
    totalHours: 30,
    frictionRate: 0.1,
  },
];

const station = (
  id: string,
  name: string,
  bikesAvailable: number,
  anchorsFree = 10
): SocialStationCandidate => ({
  id,
  name,
  capacity: 20,
  bikesAvailable,
  anchorsFree,
});

function selection(
  mode: SocialStationSelection<SocialStationCandidate>['mode'],
  stations: SocialStationCandidate[]
): SocialStationSelection<SocialStationCandidate> {
  return { mode, stations };
}

const week: SocialWeekRange = {
  weekStart: '2026-10-19',
  weekEnd: '2026-10-25',
  startIso: '2026-10-18T22:00:00.000Z',
  endExclusiveIso: '2026-10-25T23:00:00.000Z',
};

describe('morning story', () => {
  it('frames empty key stations and includes stations, districts and network', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-27',
      selection: selection('empty', [
        station('s1', 'Plaza España', 0),
        station('s2', 'Independencia', 0),
      ]),
      topDistricts: districts,
      network,
    });

    expect(story).not.toBeNull();
    expect(story?.headline).toBe('2 estaciones clave agotadas');
    expect(story?.kicker).toBe('Mañana en bici · 07:00–08:30');
    expect(story?.facts.map((fact) => fact.label)).toEqual(
      expect.arrayContaining(['Estaciones clave agotadas', 'Movimiento por zonas', 'Red'])
    );
    expect(story?.facts[0]?.value).toContain('Plaza España (0 bicis)');
    expect(story?.accent).toBe('#b91c1c');
    expect(story?.caption).toContain('Story de la mañana');
    expect(story?.altText).toContain('2 estaciones clave agotadas');
  });

  it('uses the real data window when a catch-up publishes later', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-27',
      selection: selection('empty', [station('s1', 'Plaza España', 0)]),
      topDistricts: districts,
      network,
      dataWindow: '08:00–09:30',
    });

    expect(story?.kicker).toBe('Mañana en bici · 08:00–09:30');
    expect(story?.caption).toContain('08:00–09:30');
  });

  it('uses low availability mode when nothing is empty', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-27',
      selection: selection('low', [station('s2', 'Independencia', 2)]),
      topDistricts: districts,
      network,
    });

    expect(story?.headline).toBe('1 estación clave con poca disponibilidad');
    expect(story?.facts[0]?.value).toContain('2 bicis');
    expect(story?.accent).toBe('#b45309');
  });

  it('keeps the weekend framing and avoids commute language', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-31',
      selection: selection('none', []),
      topDistricts: districts,
      network,
    });

    expect(story?.headline).toBe('Sin agotadas entre las estaciones clave');
    expect(story?.kicker).toBe('Fin de semana en bici · 07:00–08:30');
    expect(story?.kicker).not.toMatch(COMMUTE_TERM);
  });

  it('returns null when there is no station, district or network material', () => {
    expect(
      buildMorningStory({
        dateKey: '2026-10-27',
        selection: selection('none', []),
        topDistricts: [],
        network: { ...network, criticalStationsCount: 0, totalStations: 0 },
      })
    ).toBeNull();
  });
});

describe('afternoon story priority', () => {
  const input = {
    dateKey: '2026-10-27',
    network,
    topDistricts: districts,
  } as const;

  it('puts the most severe active alert first', () => {
    const story = buildAfternoonStory({
      ...input,
      alerts: [
        {
          stationId: 's1',
          stationName: 'Plaza España',
          alertType: 'LOW_BIKES',
          severity: 2,
          metricValue: 1,
          windowHours: 3,
        },
      ],
      episodes: [
        { stationId: 's2', stationName: 'Independencia', kind: 'empty', maxMinutes: 240 },
      ],
      anomaly: {
        hour: 18,
        value: 5000,
        baseline: 3000,
        deviationRatio: 0.66,
        direction: 'up',
        isAnomaly: true,
      },
    });

    expect(story.headline).toBe('Plaza España: pocas bicis');
    expect(story.facts[0]).toEqual({ label: 'Media en 3 h', value: '1 bici' });
    expect(story.headline).not.toContain('posible pico');
  });

  it('falls back to a critical episode of at least 180 minutes', () => {
    const story = buildAfternoonStory({
      ...input,
      alerts: [
        {
          stationId: 's1',
          stationName: 'Plaza España',
          alertType: 'LOW_BIKES',
          severity: 2,
          metricValue: 1,
          windowHours: 6,
        },
      ],
      episodes: [
        { stationId: 's2', stationName: 'Independencia', kind: 'empty', maxMinutes: 240 },
        { stationId: 's3', stationName: 'Universidad', kind: 'full', maxMinutes: 90 },
      ],
    });

    expect(story.headline).toBe(
      'Independencia: hasta 240 min sin bicis en 24 h'
    );
    expect(story.facts[0]).toEqual({
      label: 'Racha máxima (24 h)',
      value: '240 min',
    });
  });

  it('labels an hourly anomaly as a possible peak, never a confirmed cause', () => {
    const story = buildAfternoonStory({
      ...input,
      anomaly: {
        hour: 18,
        value: 5000,
        baseline: 3000,
        deviationRatio: 0.66,
        direction: 'up',
        isAnomaly: true,
      },
    });

    expect(story.headline).toBe('Posible pico de movimiento a las 18:00');
    expect(story.headline.toLowerCase()).toContain('posible pico');
    expect(story.facts.map((fact) => fact.label)).toEqual(
      expect.arrayContaining(['Índice de actividad', 'Referencia', 'Desviación'])
    );
    expect(story.facts.map((fact) => fact.value).join(' ')).not.toContain('Fiestas del Pilar');
  });

  it('mentions a curated cause only when the caller provides it', () => {
    const withoutCause = buildAfternoonStory({
      ...input,
      anomaly: {
        hour: 18,
        value: 5000,
        baseline: 3000,
        deviationRatio: 0.66,
        direction: 'up',
        isAnomaly: true,
      },
    });
    const withCause = buildAfternoonStory({
      ...input,
      cause: { label: 'Fiestas del Pilar', kind: 'event' },
      anomaly: {
        hour: 18,
        value: 5000,
        baseline: 3000,
        deviationRatio: 0.66,
        direction: 'up',
        isAnomaly: true,
      },
    });

    expect(withoutCause.facts.map((fact) => fact.value).join(' ')).not.toContain(
      'Fiestas del Pilar'
    );
    expect(withCause.facts).toContainEqual({
      label: 'Contexto',
      value: 'Fiestas del Pilar',
    });
  });

  it('uses the return pulse when there is no alert, episode or upward anomaly', () => {
    const story = buildAfternoonStory({
      ...input,
      anomaly: {
        hour: 18,
        value: 1000,
        baseline: 3000,
        deviationRatio: -0.66,
        direction: 'down',
        isAnomaly: true,
      },
    });

    expect(story.headline).toBe('Más movimiento estimado en Centro');
    expect(story.kicker).toBe('Cómo va la tarde · 17:00–18:30');
    expect(story.facts[0]).toEqual({
      label: 'Centro',
      value: '1200 puntos de actividad',
    });
    expect(story.bars?.[0]?.label).toBe('Centro');
  });

  it('uses weekend framing and still returns a story with sparse data', () => {
    const story = buildAfternoonStory({
      dateKey: '2026-11-01',
      network: { ...network, totalStations: 0, criticalStationsCount: 0 },
    });

    expect(story.kicker).toBe('Cómo va el fin de semana · 17:00–18:30');
    expect(story.kicker).not.toMatch(COMMUTE_TERM);
    expect(story.facts.length).toBeGreaterThan(0);
  });
});

describe('weekly carousel', () => {
  it('builds five slides with cover, activity, growth, friction and CTA', () => {
    const carousel = buildWeeklyCarousel({ week, districts, network });

    expect(carousel).not.toBeNull();
    expect(carousel?.slides).toHaveLength(5);
    expect(carousel?.headline).toBe(
      'Zaragoza en bici · semana del 19 al 25 de octubre'
    );
    expect(carousel?.slides[0]?.headline).toContain('semana del 19 al 25 de octubre');
    expect(carousel?.slides[1]?.facts[0]).toEqual({
      label: '1. Centro',
      value: '1200 puntos de actividad',
    });
    expect(carousel?.slides[2]?.headline).toBe('Centro sube un 20%');
    expect(carousel?.slides[3]?.headline).toBe('Delicias concentra la tensión');
    expect(carousel?.slides[4]?.facts[0]?.value).toBe(
      'semana del 19 al 25 de octubre'
    );
    expect(carousel?.slides[4]?.facts[1]?.value).toContain('datosbizi.com');
  });

  it('keeps the feed caption within limits with hashtags and disclaimer', () => {
    const carousel = buildWeeklyCarousel({ week, districts, network });

    expect(carousel?.caption.length).toBeLessThanOrEqual(2200);
    expect(carousel?.caption).toContain('#BiziZaragoza');
    expect(carousel?.caption).toContain('#DatosAbiertos');
    expect(carousel?.caption).toContain('Datos abiertos GBFS. Estimación, no viajes reales.');
    expect(carousel?.altText).toContain('Carrusel');
    expect(carousel?.slides.every((slide) => slide.footer.includes('datosbizi.com'))).toBe(
      true
    );
  });

  it('returns null without districts', () => {
    expect(buildWeeklyCarousel({ week, districts: [], network })).toBeNull();
  });
});

function monthlyReport(overrides: Partial<MonthlyReport> = {}): MonthlyReport {
  return {
    monthKey: '2026-09',
    generatedAt: '2026-10-01T08:00:00.000Z',
    hasReport: true,
    coverage: {
      monthKey: '2026-09',
      startAt: '2026-09-01T00:00:00.000Z',
      endAt: '2026-10-01T00:00:00.000Z',
      coveredDays: 30,
      expectedDays: 30,
      sampleCount: 1000,
      isClosed: true,
      isComplete: true,
      label: 'mes completo',
    },
    comparison: {
      isComparable: true,
      periodLabel: 'agosto de 2026',
      reason: '',
      normalizedDemandRatio: 0.12,
      trend: 'mejora',
      previousMonthKey: '2026-08',
    },
    balance: {
      tone: 'up',
      headline: 'La red gana actividad',
      detail: 'Septiembre cierra con más movimiento estimado.',
    },
    headline: {
      demandScore: 12345,
      avgOccupancy: 0.54,
      activeStations: 276,
      sampleCount: 1000,
      demandDeltaRatio: 0.12,
      occupancyDeltaRatio: 0.01,
      peakHour: 18,
      coveredDays: 30,
      expectedDays: 30,
    },
    summary: 'Resumen del mes.',
    highlights: [],
    recommendations: [],
    monthlyConclusions: [],
    peakDemandHours: [{ hour: 18, demandScore: 900 }],
    weekdayWeekendProfile: {
      weekday: { avgDemand: 500, avgOccupancy: 0.55, daysCount: 22 },
      weekend: { avgDemand: 300, avgOccupancy: 0.45, daysCount: 8 },
      demandGapRatio: 0.66,
      dominantPeriod: 'weekday',
    },
    trends: {
      monthly: [
        { monthKey: '2026-04', demandScore: 9000, avgOccupancy: 0.5, activeStations: 270, sampleCount: 900 },
        { monthKey: '2026-05', demandScore: 9500, avgOccupancy: 0.51, activeStations: 271, sampleCount: 920 },
        { monthKey: '2026-06', demandScore: 10000, avgOccupancy: 0.52, activeStations: 272, sampleCount: 940 },
        { monthKey: '2026-07', demandScore: 9800, avgOccupancy: 0.53, activeStations: 273, sampleCount: 960 },
        { monthKey: '2026-08', demandScore: 11000, avgOccupancy: 0.54, activeStations: 274, sampleCount: 980 },
        { monthKey: '2026-09', demandScore: 12345, avgOccupancy: 0.54, activeStations: 276, sampleCount: 1000 },
      ],
      daily: [],
      hourly: [],
    },
    seasonality: {
      sameMonthYears: 3,
      previousYearsAvgDemand: 10000,
      ratioVsPreviousYears: 0.2,
      seriesAvgDemand: 11000,
      ratioVsSeries: 0.1,
      label: 'Por encima de la serie histórica',
    },
    districts: {
      mostActive: [
        {
          district: 'Centro',
          demandScore: 2100,
          avgOccupancy: 0.6,
          stations: 25,
          emptyHours: 10,
          fullHours: 5,
          totalHours: 100,
          frictionRate: 0.15,
        },
      ],
      leastActive: [],
      undersupplied: [],
    },
    heatmap: [],
    problemSpots: {
      worstFriction: [
        {
          stationId: 's1',
          stationName: 'Plaza España',
          district: 'Centro',
          emptyHours: 10,
          fullHours: 2,
          totalHours: 40,
          frictionHours: 12,
          frictionRate: 0.3,
        },
      ],
      worstMorning: [],
      longestEpisodes: [],
    },
    redistribution: {
      networkFrictionRate: 0.16,
      emptyHours: 10,
      fullHours: 6,
      rotation: 1.2,
      ineffectiveStations: [],
      note: 'Nota de redistribución.',
    },
    topStations: [{ stationId: 's1', stationName: 'Plaza España', avgDemand: 88.5 }],
    leastUsedStations: [],
    anomalies: [],
    ...overrides,
  };
}

describe('monthly carousel', () => {
  it('builds five slides from the monthly report without recomputing it', () => {
    const carousel = buildMonthlyCarousel({ report: monthlyReport() });

    expect(carousel).not.toBeNull();
    expect(carousel?.slides).toHaveLength(5);
    expect(carousel?.headline).toBe('Zaragoza en bici · septiembre de 2026');
    expect(carousel?.slides[1]?.facts).toEqual(
      expect.arrayContaining([
        { label: 'Índice de actividad', value: '12.345 puntos de actividad/mes' },
        { label: 'Ocupación media', value: '54%' },
        { label: 'Estaciones activas', value: '276' },
        { label: 'Días con datos', value: '30 de 30' },
      ])
    );
    expect(carousel?.slides[2]?.headline).toBe(
      'La actividad mejora frente al mes anterior'
    );
    expect(carousel?.slides[3]?.headline).toBe('Centro lidera la actividad');
    expect(carousel?.slides[4]?.facts[0]?.value).toBe(
      'datosbizi.com/informes/2026-09'
    );
    expect(carousel?.caption).toContain('#BiziZaragoza');
    expect(carousel?.caption).toContain(
      'Datos abiertos GBFS. Estimación, no viajes reales.'
    );
    expect(carousel?.caption.length).toBeLessThanOrEqual(2200);
  });

  it('uses the report path override for the CTA', () => {
    const carousel = buildMonthlyCarousel({
      report: monthlyReport(),
      reportPath: '/informes/septiembre',
    });

    expect(carousel?.slides[4]?.facts[0]?.value).toBe(
      'datosbizi.com/informes/septiembre'
    );
  });

  it('returns null when the report is missing or covers no days', () => {
    expect(
      buildMonthlyCarousel({ report: monthlyReport({ hasReport: false }) })
    ).toBeNull();
    expect(
      buildMonthlyCarousel({
        report: monthlyReport({
          coverage: {
            ...monthlyReport().coverage,
            coveredDays: 0,
          },
        }),
      })
    ).toBeNull();
    expect(
      buildMonthlyCarousel({
        report: monthlyReport({
          coverage: {
            ...monthlyReport().coverage,
            coveredDays: 15,
            isComplete: false,
            label: 'periodo incompleto',
          },
        }),
      })
    ).toBeNull();
  });
});
