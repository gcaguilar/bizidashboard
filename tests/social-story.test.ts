import { describe, expect, it } from 'vitest';

import {
  buildAfternoonStory,
  buildFeatureStory,
  buildMiddayStory,
  buildMonthlyCarousel,
  buildMorningStory,
  buildWeeklyCarousel,
} from '@/lib/social/story';
import { SOCIAL_FEED_DISCLAIMER } from '@/lib/social/copy';
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
      network,
    });

    expect(story).not.toBeNull();
    expect(story?.headline).toBe('2 estaciones que suelen vaciarse, sin bicis');
    expect(story?.kicker).toBe('Bizi esta mañana · 08:30');
    expect(story?.facts.map((fact) => fact.label)).toEqual(
      expect.arrayContaining(['Estaciones sin bicis', 'En toda la red'])
    );
    expect(story?.facts.map((fact) => fact.label)).not.toContain('Distritos con más uso');
    expect(story?.bars).toBeUndefined();
    expect(story?.facts.find((fact) => fact.label === 'En toda la red')?.value).toBe(
      '12 de 276 estaciones sin bicis o sin huecos'
    );
    expect(story?.facts[0]?.value).toBe('Plaza España · Independencia');
    expect(story?.accent).toBe('#b91c1c');
    expect(story?.caption).toContain('Story de la mañana');
    expect(story?.altText).toContain('2 estaciones que suelen vaciarse, sin bicis');
  });

  it('uses the real data window when a catch-up publishes later', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-27',
      selection: selection('empty', [station('s1', 'Plaza España', 0)]),
      network,
      dataWindow: '08:29',
    });

    expect(story?.kicker).toBe('Bizi esta mañana · 08:29');
    expect(story?.caption).toContain('08:29');
    expect(story?.altText).toContain('Datos de las 08:29.');
  });

  it('uses low availability mode when nothing is empty', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-27',
      selection: selection('low', [station('s2', 'Independencia', 2)]),
      network,
    });

    expect(story?.headline).toBe('1 estación que suele vaciarse, con pocas bicis');
    expect(story?.facts[0]?.value).toContain('2 bicis');
    expect(story?.accent).toBe('#b45309');
  });

  it('keeps the weekend framing and avoids commute language', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-31',
      selection: selection('none', []),
      network,
    });

    expect(story?.headline).toBe('Hay bicis en las estaciones que suelen vaciarse');
    expect(story?.kicker).toBe('Bizi este fin de semana · 08:30');
    expect(story?.kicker).not.toMatch(COMMUTE_TERM);
  });

  it('suggests a nearby station with bikes when one is provided', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-27',
      selection: selection('empty', [station('s1', 'Plaza España', 0)]),
      alternative: {
        fromStationId: 's1',
        name: 'Independencia',
        kind: 'bikes',
        distanceMeters: 280,
        available: 8,
      },
      network,
    });

    expect(story?.facts).toContainEqual({
      label: 'Dónde coger bici cerca',
      value: 'Desde Plaza España: Independencia, a unos 280 m (8 bicis)',
    });
    expect(story?.facts[1]?.label).toBe('Dónde coger bici cerca');
  });

  it('lists the usual stations with their bikes when nothing is wrong', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-27',
      selection: selection('none', [
        station('s1', 'Plaza España', 7),
        station('s2', 'Independencia', 5),
      ]),
      network,
    });

    expect(story?.headline).toBe('Hay bicis en las estaciones que suelen vaciarse');
    expect(story?.facts[0]).toEqual({
      label: 'Estaciones que suelen vaciarse',
      value: 'Plaza España (7 bicis) · Independencia (5 bicis)',
    });
    expect(story?.accent).toBe('#0f766e');
  });

  it('adds stations that are dropping fast as an observed fact with its window', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-27',
      selection: selection('none', [station('s1', 'Plaza España', 7)]),
      dropping: [
        { stationId: 's3', name: 'Gran Vía', bikesBefore: 9, bikesNow: 3, minutes: 28 },
        { stationId: 's4', name: 'Universidad', bikesBefore: 6, bikesNow: 1, minutes: 30 },
      ],
      network,
    });

    expect(story?.facts).toContainEqual({
      label: 'Bajando rápido',
      value: 'Gran Vía: de 9 a 3 bicis en 28 min · Universidad: de 6 a 1 bici en 30 min',
    });
    // Es un hecho pasado, nunca una promesa de futuro.
    expect(JSON.stringify(story?.facts)).not.toMatch(/se vaciar|se quedar/iu);
  });

  it('announces a special day right after the availability facts', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-12',
      selection: selection('empty', [station('s1', 'Plaza España', 0)]),
      cause: { label: 'Fiestas del Pilar', kind: 'event' },
      profiles: [{ stationId: 's1', emptyShare: 0.6, sampleCount: 40 }],
      network,
    });

    expect(story?.facts).toContainEqual({ label: 'Hoy', value: 'Fiestas del Pilar' });
    // El render pinta 4 hechos: en un dia especial la red es lo que se cae.
    expect(story?.facts.slice(0, 4).map((fact) => fact.label)).toEqual([
      'Estaciones sin bicis',
      'Hoy',
      'Lo habitual, de lunes a viernes de 7 a 9 h',
      'En toda la red',
    ]);
    expect(story?.facts.map((fact) => fact.label)).not.toContain('Contexto');
  });

  it('ignores an alternative that does not match a featured station', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-27',
      selection: selection('empty', [station('s1', 'Plaza España', 0)]),
      alternative: {
        fromStationId: 'other',
        name: 'X',
        kind: 'bikes',
        distanceMeters: 100,
        available: 5,
      },
      network,
    });

    expect(story?.facts.map((fact) => fact.label)).not.toContain('Dónde coger bici cerca');
  });

  it('says how often the featured station is usually empty, only with enough samples', () => {
    const base = {
      dateKey: '2026-10-27',
      selection: selection('empty', [
        station('s1', 'Plaza España', 0),
        station('s2', 'Independencia', 0),
      ]),
      network,
    } as const;

    const withProfile = buildMorningStory({
      ...base,
      profiles: [{ stationId: 's1', emptyShare: 0.6, sampleCount: 40 }],
    });
    expect(withProfile?.facts).toContainEqual({
      label: 'Lo habitual, de lunes a viernes de 7 a 9 h',
      value: 'Plaza España: sin bicis el 60% del tiempo',
    });

    const fewSamples = buildMorningStory({
      ...base,
      profiles: [{ stationId: 's1', emptyShare: 0.6, sampleCount: 3 }],
    });
    const rare = buildMorningStory({
      ...base,
      profiles: [{ stationId: 's1', emptyShare: 0.02, sampleCount: 40 }],
    });
    for (const story of [fewSamples, rare, buildMorningStory(base)]) {
      expect(story?.facts.map((fact) => fact.label)).not.toContain(
        'Lo habitual, de lunes a viernes de 7 a 9 h'
      );
    }
  });

  it('records the stations that actually appear in the story', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-27',
      selection: selection('empty', [station('s1', 'Plaza España', 0)]),
      fullStations: selection('full', [
        { ...station('s2', 'Universidad', 20), anchorsFree: 0 },
      ]),
      dropping: [
        { stationId: 's3', name: 'Gran Vía', bikesBefore: 9, bikesNow: 3, minutes: 28 },
      ],
      network,
    });

    expect(story?.metadata).toEqual({
      stationIds: ['s1', 's2', 's3'],
    });
  });

  it('returns null when there is no station or network material', () => {
    expect(
      buildMorningStory({
        dateKey: '2026-10-27',
        selection: selection('none', []),
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
    expect(story.facts[0]).toEqual({ label: 'Media de las últimas 3 h', value: '1 bici' });
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
      label: 'Peor racha en 24 h',
      value: '240 min',
    });
  });

  it('labels an hourly anomaly as a possible peak, never a confirmed cause', () => {
    const story = buildAfternoonStory({
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

    expect(story.headline).toBe('Posible pico de uso a las 18:00');
    expect(story.headline.toLowerCase()).toContain('posible pico');
    expect(story.facts[0]).toEqual({
      label: 'Uso frente a lo habitual a esa hora',
      value: '+66%',
    });
    expect(story.facts).toContainEqual({ label: 'Contexto', value: 'Fiestas del Pilar' });
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

    // Sin causa, un pico suelto no se cuenta: cae al resumen por distritos.
    expect(withoutCause.headline).toBe('Más uso de la Bizi en Centro');
    expect(withoutCause.facts.map((fact) => fact.value).join(' ')).not.toContain(
      'Fiestas del Pilar'
    );
    expect(withCause.headline).toBe('Posible pico de uso a las 18:00');
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

    expect(story.headline).toBe('Más uso de la Bizi en Centro');
    expect(story.kicker).toBe('Bizi esta tarde · 17:00–18:30');
    expect(story.facts[0]).toEqual({ label: 'Más uso', value: 'Centro' });
    expect(story.facts[1]).toEqual({ label: 'Segundo', value: 'Delicias' });
    expect(story.bars?.[0]).toEqual({ label: 'Centro', value: 150 });
    expect(story.bars?.[0]?.label).toBe('Centro');
  });

  it('records the rendered stations and districts in the metadata', () => {
    const story = buildAfternoonStory({
      ...input,
      emptyStations: selection('empty', [station('s9', 'Delicias', 0)]),
    });

    expect(story.metadata?.stationIds).toEqual(['s9']);
    expect(story.metadata?.districtNames).toEqual([
      'Centro',
      'Delicias',
      'Universidad',
    ]);
  });

  it('limits metadata to the single station on alert branches', () => {
    const story = buildAfternoonStory({
      ...input,
      emptyStations: selection('empty', [station('s9', 'Delicias', 0)]),
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
    });

    expect(story.metadata).toEqual({ stationIds: ['s1'] });
  });

  it('uses weekend framing and still returns a story with sparse data', () => {
    const story = buildAfternoonStory({
      dateKey: '2026-11-01',
      network: { ...network, totalStations: 0, criticalStationsCount: 0 },
    });

    expect(story.kicker).toBe('Bizi este fin de semana · tarde · 17:00–18:30');
    expect(story.kicker).not.toMatch(COMMUTE_TERM);
    expect(story.facts.length).toBeGreaterThan(0);
  });
});

describe('afternoon "where to leave the bike" branch', () => {
  const base = { dateKey: '2026-10-27', network, topDistricts: districts } as const;
  const full = (id: string, name: string) => ({ ...station(id, name, 20, 0), anchorsFree: 0 });

  it('mirrors the morning story for stations that usually fill up', () => {
    const story = buildAfternoonStory({
      ...base,
      fullStations: selection('full', [full('s1', 'Plaza España'), full('s2', 'Independencia')]),
      eveningProfiles: [{ stationId: 's1', fullShare: 0.4, sampleCount: 40 }],
      alternative: {
        fromStationId: 's1',
        name: 'Gran Vía',
        kind: 'anchors',
        distanceMeters: 190,
        available: 12,
      },
    });

    expect(story.headline).toBe('2 estaciones que suelen llenarse, sin huecos');
    expect(story.kicker).toBe('Bizi esta tarde · 17:00–18:30');
    expect(story.facts).toEqual(
      expect.arrayContaining([
        { label: 'Estaciones sin huecos', value: 'Plaza España · Independencia' },
        {
          label: 'Dónde dejar la bici cerca',
          value: 'Desde Plaza España: Gran Vía, a unos 190 m (12 huecos)',
        },
        {
          label: 'Lo habitual, de lunes a viernes de 17 a 19 h',
          value: 'Plaza España: sin huecos el 40% del tiempo',
        },
      ])
    );
    expect(story.accent).toBe('#b91c1c');
    expect(story.bars).toBeUndefined();
  });

  it('uses amber and counts free anchors when stations are only close to full', () => {
    const story = buildAfternoonStory({
      ...base,
      fullStations: selection('low', [{ ...station('s1', 'Plaza España', 18), anchorsFree: 2 }]),
    });

    expect(story.headline).toBe('1 estación que suele llenarse, con pocos huecos');
    expect(story.facts[0]).toEqual({
      label: 'Estaciones con pocos huecos',
      value: 'Plaza España (2 huecos)',
    });
    expect(story.accent).toBe('#b45309');
  });

  it('keeps alerts and critical episodes ahead of it', () => {
    const fullStations = selection('full', [full('s1', 'Plaza España')]);
    const withAlert = buildAfternoonStory({
      ...base,
      fullStations,
      alerts: [
        {
          stationId: 's9',
          stationName: 'Universidad',
          alertType: 'LOW_BIKES',
          severity: 2,
          metricValue: 1,
          windowHours: 3,
        },
      ],
    });
    const withEpisode = buildAfternoonStory({
      ...base,
      fullStations,
      episodes: [{ stationId: 's9', stationName: 'Universidad', kind: 'empty', maxMinutes: 240 }],
    });

    expect(withAlert.headline).toBe('Universidad: pocas bicis');
    expect(withEpisode.headline).toBe('Universidad: hasta 240 min sin bicis en 24 h');
  });

  it('falls through to the district pulse when no station is full', () => {
    const story = buildAfternoonStory({ ...base, fullStations: selection('none', []) });

    expect(story.headline).toBe('Más uso de la Bizi en Centro');
  });
});

describe('opposite side of each daily story', () => {
  const full = (id: string, name: string) => ({ ...station(id, name, 20, 0), anchorsFree: 0 });

  it('adds where to leave the bike to the morning story, right after the alternative', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-27',
      selection: selection('empty', [station('s1', 'Plaza España', 0)]),
      alternative: {
        fromStationId: 's1',
        name: 'Independencia',
        kind: 'bikes',
        distanceMeters: 280,
        available: 8,
      },
      fullStations: selection('full', [full('s2', 'Universidad'), { ...full('s3', 'Gran Vía') }]),
      network,
    });

    expect(story?.facts[1]?.label).toBe('Dónde coger bici cerca');
    expect(story?.facts[2]).toEqual({
      label: 'Estaciones que suelen llenarse',
      value: 'Universidad (sin huecos) · Gran Vía (sin huecos)',
    });
    // El titular sigue yendo por el lado principal.
    expect(story?.headline).toBe('1 estación que suele vaciarse, sin bicis');
  });

  it('counts free docks when the morning arrival stations are only close to full', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-27',
      selection: selection('none', [station('s1', 'Plaza España', 7)]),
      fullStations: selection('low', [{ ...station('s2', 'Universidad', 18), anchorsFree: 2 }]),
      network,
    });

    expect(story?.facts).toContainEqual({
      label: 'Estaciones que suelen llenarse',
      value: 'Universidad (2 huecos)',
    });
  });

  it('names the usual filling cohort with its current free docks when none is full', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-27',
      selection: selection('none', [station('s1', 'Plaza España', 7)]),
      fullStations: selection('none', [
        { ...station('s2', 'Universidad', 18), anchorsFree: 14 },
      ]),
      network,
    });

    expect(story?.facts).toContainEqual({
      label: 'Estaciones que suelen llenarse',
      value: 'Universidad (14 huecos)',
    });
  });

  it('omits the opposite fact when nothing is full', () => {
    const story = buildMorningStory({
      dateKey: '2026-10-27',
      selection: selection('none', [station('s1', 'Plaza España', 7)]),
      fullStations: selection('none', []),
      network,
    });

    expect(story?.facts.some((fact) => fact.label === 'Estaciones que suelen llenarse')).toBe(false);
  });

  it('adds where to pick up a bike to the afternoon story', () => {
    const base = { dateKey: '2026-10-27', network, topDistricts: districts } as const;
    const emptyStations = selection('empty', [station('s9', 'Delicias', 0), station('s8', 'Centro', 0)]);
    const expected = {
      label: 'Estaciones que suelen vaciarse',
      value: 'Delicias (sin bicis) · Centro (sin bicis)',
    };

    const whereToLeave = buildAfternoonStory({
      ...base,
      fullStations: selection('full', [full('s1', 'Plaza España')]),
      emptyStations,
    });
    const pulse = buildAfternoonStory({ ...base, emptyStations });

    expect(whereToLeave.headline).toBe('1 estación que suele llenarse, sin huecos');
    expect(whereToLeave.facts).toContainEqual(expected);
    expect(pulse.headline).toBe('Más uso de la Bizi en Centro');
    expect(pulse.facts).toContainEqual(expected);
  });

  it('names the usual emptying cohort with its bikes even when nothing is empty', () => {
    const base = { dateKey: '2026-10-27', network, topDistricts: districts } as const;
    const emptyStations = selection('none', [
      station('s9', 'Delicias', 6),
      station('s8', 'Centro', 4),
    ]);
    const expected = {
      label: 'Estaciones que suelen vaciarse',
      value: 'Delicias (6 bicis) · Centro (4 bicis)',
    };

    const whereToLeave = buildAfternoonStory({
      ...base,
      fullStations: selection('full', [full('s1', 'Plaza España')]),
      emptyStations,
    });
    const pulse = buildAfternoonStory({ ...base, emptyStations });

    expect(whereToLeave.facts).toContainEqual(expected);
    expect(pulse.facts).toContainEqual(expected);
  });

  it('keeps alerts and critical episodes about a single station', () => {
    const story = buildAfternoonStory({
      dateKey: '2026-10-27',
      network,
      topDistricts: districts,
      emptyStations: selection('empty', [station('s9', 'Delicias', 0)]),
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
    });

    expect(story.facts.some((fact) => fact.label === 'Estaciones que suelen vaciarse')).toBe(false);
  });
});

describe('midday story', () => {
  const base = { dateKey: '2026-10-27', network } as const;
  const empty = (id: string, name: string) => station(id, name, 0);
  const full = (id: string, name: string) => ({ ...station(id, name, 20, 0), anchorsFree: 0 });

  it('puts both sides in one story when both have problems', () => {
    const story = buildMiddayStory({
      ...base,
      emptyStations: selection('empty', [empty('s1', 'Plaza España'), empty('s2', 'Delicias')]),
      fullStations: selection('full', [full('s3', 'Universidad')]),
      bikesAlternative: {
        fromStationId: 's1',
        name: 'Independencia',
        kind: 'bikes',
        distanceMeters: 280,
        available: 8,
      },
      anchorsAlternative: {
        fromStationId: 's3',
        name: 'Gran Vía',
        kind: 'anchors',
        distanceMeters: 190,
        available: 12,
      },
    });

    expect(story?.slot).toBe('midday');
    expect(story?.family).toBe('daily-story');
    expect(story?.headline).toBe('2 estaciones habituales sin bicis y 1 sin huecos');
    expect(story?.kicker).toBe('Bizi a mediodía · 13:00');
    expect(story?.facts.map((fact) => fact.label)).toEqual([
      'Estaciones que suelen vaciarse',
      'Dónde coger bici cerca',
      'Estaciones que suelen llenarse',
      'Dónde dejar la bici cerca',
      'En toda la red',
    ]);
    expect(story?.accent).toBe('#b91c1c');
  });

  it('records both sides in the metadata', () => {
    const story = buildMiddayStory({
      ...base,
      emptyStations: selection('empty', [empty('s1', 'Plaza España')]),
      fullStations: selection('full', [full('s3', 'Universidad')]),
    });

    expect(story?.metadata).toEqual({ stationIds: ['s1', 's3'] });
  });

  it('falls back to the side that has a problem', () => {
    const onlyEmpty = buildMiddayStory({
      ...base,
      emptyStations: selection('low', [{ ...station('s1', 'Plaza España', 2) }]),
      fullStations: selection('none', []),
    });
    const onlyFull = buildMiddayStory({
      ...base,
      emptyStations: selection('none', []),
      fullStations: selection('low', [{ ...station('s2', 'Universidad', 18), anchorsFree: 2 }]),
    });

    expect(onlyEmpty?.headline).toBe('1 estación que suele vaciarse, con pocas bicis');
    expect(onlyEmpty?.facts[0]).toEqual({
      label: 'Estaciones que suelen vaciarse',
      value: 'Plaza España (2 bicis)',
    });
    expect(onlyEmpty?.accent).toBe('#b45309');
    expect(onlyFull?.headline).toBe('1 estación que suele llenarse, con pocos huecos');
    expect(onlyFull?.facts[0]).toEqual({
      label: 'Estaciones que suelen llenarse',
      value: 'Universidad (2 huecos)',
    });
  });

  it('says all is well when neither side has a problem', () => {
    const story = buildMiddayStory({
      ...base,
      emptyStations: selection('none', [station('s1', 'Plaza España', 7)]),
      fullStations: selection('none', []),
    });

    expect(story?.headline).toBe('Hay bicis y huecos en las estaciones habituales');
    expect(story?.accent).toBe('#0f766e');
    // El fallback del lado vacio es solo de la tarde; mediodia mantiene su
    // mensaje de "todo bien" sin listar cohortes.
    expect(
      story?.facts.some((fact) => fact.label === 'Estaciones que suelen vaciarse')
    ).toBe(false);
  });

  it('uses the weekend framing and returns null without stations or network', () => {
    const weekend = buildMiddayStory({
      ...base,
      dateKey: '2026-10-31',
      emptyStations: selection('none', []),
      fullStations: selection('none', []),
    });

    expect(weekend?.kicker).toBe('Bizi este fin de semana · mediodía · 13:00');
    expect(weekend?.kicker).not.toMatch(COMMUTE_TERM);
    expect(
      buildMiddayStory({
        dateKey: '2026-10-27',
        emptyStations: selection('none', []),
        fullStations: selection('none', []),
        network: { ...network, totalStations: 0 },
      })
    ).toBeNull();
  });
});

describe('weekly carousel', () => {
  it('builds five slides without a spotlight district', () => {
    const carousel = buildWeeklyCarousel({ week, districts, network });

    expect(carousel).not.toBeNull();
    expect(carousel?.slides).toHaveLength(5);
    expect(carousel?.headline).toBe('Centro: donde más se usa la Bizi');
    expect(carousel?.slides[0]?.headline).toBe('Centro: donde más se usa la Bizi');
    expect(carousel?.slides[0]?.facts[0]).toEqual({
      label: 'Cómo se mide',
      value: 'Uso medio de cada estación del distrito',
    });
    expect(carousel?.slides[0]?.kicker).toBe('Semana del 19 al 25 de octubre');
    expect(carousel?.caption).toContain(
      'Centro: donde más se usa la Bizi · semana del 19 al 25 de octubre'
    );
    expect(carousel?.slides[1]?.facts[0]).toEqual({
      label: '1. Centro',
      value: '150 puntos por estación',
    });
    expect(carousel?.slides[2]?.headline).toBe('El uso en Centro sube un 20%');
    expect(carousel?.slides[3]?.headline).toBe('Delicias: más horas sin bicis o huecos');
    expect(carousel?.slides[4]?.facts[0]?.label).toBe('Qué son los puntos de actividad');
    expect(carousel?.slides[4]?.facts[1]?.value).toContain('datosbizi.com');
  });

  it('adds a sixth "Barrio del día" slide before the CTA', () => {
    const spotlight = districts[2]!;
    const carousel = buildWeeklyCarousel({
      week,
      districts,
      spotlightDistrict: spotlight,
      network,
    });

    expect(carousel?.slides).toHaveLength(6);
    expect(carousel?.slides[3]?.headline).toBe('Delicias: más horas sin bicis o huecos');
    expect(carousel?.slides[4]?.kicker).toBe('Barrio del día');
    expect(carousel?.slides[4]?.headline).toBe('Este lunes miramos a Universidad');
    expect(carousel?.slides[4]?.facts).toEqual([
      { label: 'Estaciones del barrio', value: '6' },
      { label: 'Uso medio por estación', value: '100 puntos' },
      {
        label: 'Horas sin bicis o sin huecos',
        value: '3 de 30 h · 10%',
      },
    ]);
    // La CTA sigue cerrando el carrusel.
    expect(carousel?.slides[5]?.facts[0]?.label).toBe('Qué son los puntos de actividad');
    expect(carousel?.slides[5]?.facts[1]?.value).toContain('datosbizi.com');
  });

  it('keeps the spotlight honest when the district has no critical hours', () => {
    const spotlight: SocialDistrictStats = {
      ...districts[2]!,
      district: 'Actur',
      stationCount: 4,
      totalHours: 0,
      emptyHours: 0,
      fullHours: 0,
      frictionRate: 0,
    };
    const carousel = buildWeeklyCarousel({
      week,
      districts,
      spotlightDistrict: spotlight,
      network,
    });

    expect(carousel?.slides[4]?.facts[2]).toEqual({
      label: 'Disponibilidad',
      value: 'Sin horas críticas registradas',
    });
  });

  it('records the spotlight district in the metadata', () => {
    const spotlight: SocialDistrictStats = {
      ...districts[2]!,
      district: 'Actur',
      stationCount: 4,
    };
    const carousel = buildWeeklyCarousel({
      week,
      districts,
      spotlightDistrict: spotlight,
      network,
    });

    expect(carousel?.metadata).toEqual({
      districtNames: ['Centro', 'Delicias', 'Universidad', 'Actur'],
      spotlightDistrict: 'Actur',
    });
  });

  it('keeps the feed caption within limits with hashtags and disclaimer', () => {
    const carousel = buildWeeklyCarousel({ week, districts, network });

    expect(carousel?.caption.length).toBeLessThanOrEqual(2200);
    expect(carousel?.caption).toContain(
      'utm_source=instagram&utm_medium=social&utm_campaign=weekly'
    );
    expect(carousel?.caption).toContain('#BiziZaragoza');
    expect(carousel?.caption).toContain('#DatosAbiertos');
    expect(carousel?.caption).toContain(SOCIAL_FEED_DISCLAIMER);
    // Una foto de la red de un lunes no resume la semana.
    expect(carousel?.caption).not.toContain('12 de 276');
    expect(carousel?.altText).toContain('Carrusel');
    expect(carousel?.slides.every((slide) => slide.footer.includes('datosbizi.com'))).toBe(
      true
    );
  });

  it('ranks districts by use per station, not by raw total', () => {
    const big: SocialDistrictStats = {
      ...districts[0]!,
      district: 'Grande',
      stationCount: 40,
      activityIndex: 2000,
      previousActivityIndex: 2000,
      growthRatio: 0,
    };
    const carousel = buildWeeklyCarousel({ week, districts: [big, ...districts], network });

    // Grande suma mas (2000) pero 50 por estacion; Centro tiene 150.
    expect(carousel?.slides[0]?.headline).toBe('Centro: donde más se usa la Bizi');
  });

  it('ignores growth computed over a tiny base', () => {
    const tiny: SocialDistrictStats = {
      ...districts[1]!,
      district: 'Pequeno',
      activityIndex: 40,
      previousActivityIndex: 5,
      growthRatio: 7,
    };
    const carousel = buildWeeklyCarousel({ week, districts: [tiny, ...districts], network });

    expect(carousel?.slides[2]?.headline).toBe('El uso en Centro sube un 20%');
  });

  it('records the districts that appear in the slides', () => {
    const carousel = buildWeeklyCarousel({ week, districts, network });

    expect(carousel?.metadata).toEqual({
      districtNames: ['Centro', 'Delicias', 'Universidad'],
    });
  });

  it('returns null without districts', () => {
    expect(buildWeeklyCarousel({ week, districts: [], network })).toBeNull();
  });
});

describe('weekly feature story', () => {
  const featureStations: SocialStationCandidate[] = [
    { id: 's1', name: 'Plaza España', capacity: 20, bikesAvailable: 0, anchorsFree: 5 },
    { id: 's2', name: 'Universidad', capacity: 20, bikesAvailable: 10, anchorsFree: 0 },
    { id: 's3', name: 'Delicias', capacity: 20, bikesAvailable: 8, anchorsFree: 8 },
  ];
  const demand = [
    { stationId: 's1', activityIndex: 1200 },
    { stationId: 's2', activityIndex: 900 },
    { stationId: 's3', activityIndex: 600 },
  ];
  const friction = [
    { stationId: 's1', emptyHours: 30, fullHours: 5, totalHours: 100 },
    { stationId: 's2', emptyHours: 10, fullHours: 10, totalHours: 100 },
    { stationId: 's3', emptyHours: 0, fullHours: 0, totalHours: 100 },
  ];
  const base = {
    dateKey: '2026-10-28',
    stations: featureStations,
    demand,
    friction,
  };

  it('highlights the station with the most friction and records the theme', () => {
    const story = buildFeatureStory({ ...base, theme: 'station' });

    expect(story?.slot).toBe('feature');
    expect(story?.family).toBe('feature-story');
    expect(story?.kicker).toBe('Estación del día · última semana completa');
    expect(story?.headline).toBe('Plaza España: muchas horas sin bicis o sin huecos');
    expect(story?.facts).toEqual([
      { label: 'Uso esta semana', value: '1200 puntos' },
      { label: 'Horas sin bicis o sin huecos', value: '35 de 100 h · 35%' },
      { label: 'Ahora mismo', value: '0 bicis y 5 huecos' },
    ]);
    expect(story?.metadata).toEqual({ theme: 'station', stationIds: ['s1'] });
    expect(story?.bars?.length).toBeGreaterThan(0);
  });

  it('prefers a fresh station when the top one appeared recently', () => {
    const story = buildFeatureStory({
      ...base,
      theme: 'station',
      recentStationIds: ['s1'],
    });

    expect(story?.metadata?.stationIds).toEqual(['s2']);
    expect(story?.headline).toContain('Universidad');
  });

  it('explains the activity index without inventing data', () => {
    const story = buildFeatureStory({ ...base, theme: 'explainer' });

    expect(story?.kicker).toBe('Cómo funciona · última semana completa');
    expect(story?.headline).toBe('Los puntos de actividad, en una frase');
    expect(story?.facts[2]).toEqual({
      label: 'La red esta semana',
      value: '3 estaciones · 55 h sin bicis o sin huecos',
    });
    expect(story?.metadata).toEqual({ theme: 'explainer' });
  });

  it('builds a monthly record from the report', () => {
    const story = buildFeatureStory({
      ...base,
      theme: 'record',
      report: monthlyReport(),
    });

    expect(story?.headline).toBe('Los récords de septiembre de 2026');
    expect(story?.facts[0]).toEqual({
      label: 'Estación con más uso',
      value: 'Plaza España · 88,5 puntos de actividad/día',
    });
    expect(story?.facts[1]).toEqual({
      label: 'Distrito con más uso',
      value: 'Centro · 2100 puntos',
    });
    expect(story?.metadata).toEqual({
      theme: 'record',
      stationIds: ['s1'],
      districtNames: ['Centro'],
    });
  });

  it('answers the weekday myth with the report profile', () => {
    const story = buildFeatureStory({
      ...base,
      theme: 'myth',
      report: monthlyReport(),
    });

    expect(story?.headline).toBe('¿La Bizi se usa igual todos los días?');
    expect(story?.facts[0]).toEqual({
      label: 'Entre semana y fin de semana',
      value: 'Entre semana se usa un 67% más por día',
    });
    expect(story?.metadata?.theme).toBe('myth');
  });

  it('summarises the network for the week', () => {
    const story = buildFeatureStory({ ...base, theme: 'network' });

    expect(story?.headline).toBe('La red de Bizi esta semana');
    expect(story?.facts).toEqual([
      { label: 'Estaciones en la red', value: '3' },
      { label: 'Puntos de actividad', value: '2700 en la semana' },
      { label: 'Horas sin bicis o sin huecos', value: '55 de 300 h · 18%' },
    ]);
    expect(story?.metadata).toEqual({ theme: 'network' });
  });

  it('returns null instead of publishing empty content', () => {
    expect(
      buildFeatureStory({ ...base, theme: 'station', stations: [], friction: [] })
    ).toBeNull();
    expect(buildFeatureStory({ ...base, theme: 'station', friction: [] })).toBeNull();
    expect(buildFeatureStory({ ...base, theme: 'explainer', stations: [] })).toBeNull();
    expect(
      buildFeatureStory({ ...base, theme: 'record', report: monthlyReport({ hasReport: false }) })
    ).toBeNull();
    expect(buildFeatureStory({ ...base, theme: 'myth', report: null })).toBeNull();
    expect(buildFeatureStory({ ...base, theme: 'network', friction: [] })).toBeNull();
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
      leastActive: [
        {
          district: 'Santa Isabel',
          demandScore: 500,
          avgOccupancy: 0.4,
          stations: 4,
          emptyHours: 2,
          fullHours: 1,
          totalHours: 40,
          frictionRate: 0.1,
        },
      ],
      undersupplied: [
        {
          district: 'Casablanca',
          demandScore: 1000,
          avgOccupancy: 0.5,
          stations: 12,
          emptyHours: 20,
          fullHours: 12,
          totalHours: 100,
          frictionRate: 0.32,
        },
      ],
      all: [
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
        {
          district: 'Santa Isabel',
          demandScore: 500,
          avgOccupancy: 0.4,
          stations: 4,
          emptyHours: 2,
          fullHours: 1,
          totalHours: 40,
          frictionRate: 0.1,
        },
        {
          district: 'Casablanca',
          demandScore: 1000,
          avgOccupancy: 0.5,
          stations: 12,
          emptyHours: 20,
          fullHours: 12,
          totalHours: 100,
          frictionRate: 0.32,
        },
      ],
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
  it('builds six slides from the monthly report without recomputing it', () => {
    const carousel = buildMonthlyCarousel({ report: monthlyReport() });

    expect(carousel).not.toBeNull();
    expect(carousel?.slides).toHaveLength(6);
    expect(carousel?.headline).toBe('La Bizi en septiembre de 2026');
    expect(carousel?.slides[1]?.facts).toEqual([
      { label: 'Uso estimado', value: '12.345 puntos de actividad/mes' },
      { label: 'Hora con más uso', value: '18:00–19:00' },
      {
        label: 'Entre semana y fin de semana',
        value: 'Entre semana se usa un 67% más por día',
      },
    ]);
    expect(carousel?.slides[2]?.facts).toEqual([
      { label: 'Frente a agosto de 2026', value: '+12%' },
      { label: 'Frente a septiembre de otros años', value: '+20%' },
    ]);
    // Las 5 barras son los 5 ultimos meses: el del informe nunca queda fuera.
    expect(carousel?.slides[0]?.bars).toHaveLength(5);
    expect(carousel?.slides[0]?.bars?.at(-1)?.label).toBe('septiembre');
    expect(carousel?.slides[2]?.headline).toBe('Más uso que el mes anterior');
    expect(carousel?.slides[3]?.headline).toBe('Plaza España es la estación con más uso');
    expect(carousel?.slides[3]?.facts).toEqual([
      {
        label: 'Estación más usada',
        value: 'Plaza España · 88,5 puntos de actividad/día',
      },
      {
        label: 'Más horas sin bicis o sin huecos',
        value: 'Plaza España · 30%',
      },
    ]);
    expect(carousel?.slides[4]?.kicker).toBe('Barrios del mes');
    expect(carousel?.slides[4]?.headline).toBe('El uso por barrio, estación a estación');
    expect(carousel?.slides[4]?.facts).toEqual([
      { label: 'Barrio con más uso por estación', value: 'Santa Isabel · 125 puntos' },
      { label: 'Barrio con menos uso por estación', value: 'Casablanca · 83 puntos' },
      {
        label: 'Mayor proporción de horas sin bicis o sin huecos',
        value: 'Casablanca · 32%',
      },
    ]);
    expect(carousel?.slides[4]?.bars).toEqual([
      { label: 'Santa Isabel', value: 125 },
      { label: 'Centro', value: 84 },
      { label: 'Casablanca', value: 83 },
    ]);
    expect(carousel?.slides[5]?.facts[0]?.value).toBe(
      'datosbizi.com/informes/2026-09'
    );
    expect(carousel?.caption).toContain('#BiziZaragoza');
    expect(carousel?.caption).toContain(
      'utm_source=instagram&utm_medium=social&utm_campaign=monthly'
    );
    expect(carousel?.caption).toContain(
      'La Bizi en septiembre de 2026: Santa Isabel lidera el uso por estación'
    );
    expect(carousel?.caption).toContain('La red gana actividad');
    expect(carousel?.caption).not.toContain('Septiembre cierra con más movimiento estimado');
    expect(carousel?.caption).toContain(SOCIAL_FEED_DISCLAIMER);
    expect(carousel?.caption.length).toBeLessThanOrEqual(2200);
  });

  it('uses every district, not only the three published rankings', () => {
    const report = monthlyReport();
    report.districts.all.push({
      district: 'Actur',
      demandScore: 4000,
      avgOccupancy: 0.5,
      stations: 25,
      emptyHours: 0,
      fullHours: 0,
      totalHours: 100,
      frictionRate: 0,
    });

    const carousel = buildMonthlyCarousel({ report });

    expect(carousel?.slides[4]?.facts[0]).toEqual({
      label: 'Barrio con más uso por estación',
      value: 'Actur · 160 puntos',
    });
  });

  it('never paints months after the report month in the trend bars', () => {
    const report = monthlyReport();
    report.trends.monthly.push({
      monthKey: '2026-10',
      demandScore: 999999,
      avgOccupancy: 0.5,
      activeStations: 276,
      sampleCount: 1000,
    });

    const carousel = buildMonthlyCarousel({ report });

    expect(carousel?.slides[0]?.bars?.at(-1)?.label).toBe('septiembre');
    expect(carousel?.slides[0]?.bars?.some((bar) => bar.value === 999999)).toBe(false);
    expect(carousel?.slides[2]?.bars?.some((bar) => bar.value === 999999)).toBe(false);
  });

  it('records the top station and district shown in the report', () => {
    const carousel = buildMonthlyCarousel({ report: monthlyReport() });

    expect(carousel?.metadata).toEqual({
      stationIds: ['s1'],
      districtNames: ['Santa Isabel', 'Centro', 'Casablanca'],
    });
  });

  it('uses the report path override for the CTA', () => {
    const carousel = buildMonthlyCarousel({
      report: monthlyReport(),
      reportPath: '/informes/septiembre',
    });

    expect(carousel?.slides[5]?.facts[0]?.value).toBe(
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
