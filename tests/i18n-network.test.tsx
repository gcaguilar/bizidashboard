import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/', publicHref: (globalThis as { __href?: string }).__href ?? '/' }),
  };
});

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock('@/lib/seo-stations', () => ({ getStationSeoRows: vi.fn() }));
vi.mock('@/lib/seo-districts', () => ({ slugifyDistrictName: (name: string) => name.toLowerCase() }));
vi.mock('@/lib/api', () => ({
  fetchAlerts: vi.fn(),
  fetchSharedDatasetSnapshot: vi.fn(),
  fetchStatus: vi.fn(),
}));
vi.mock('@/services/shared-data', () => ({
  buildFallbackDatasetSnapshot: vi.fn(),
  buildFallbackStatus: vi.fn(),
}));
// The server fn needs the Start runtime; run its handler body directly.
vi.mock('@/server-functions/home', async () => {
  const actual = await import('@/server-functions/home.server');
  return {
    getHomePageData: ({ data }: { data: { locale: 'es' | 'en' } }) => actual.loadHomePageData(data.locale),
  };
});
vi.mock('@/lib/network-briefing-baseline', () => ({ fetchComparableNetworkBaseline: vi.fn() }));

import { Route as HomeRoute } from '@/app/index';
import { HomeStatusHero } from '@/app/_components/HomeStatusHero';
import { fetchAlerts, fetchSharedDatasetSnapshot, fetchStatus } from '@/lib/api';
import {
  formatAlertType,
  formatDayType,
  formatDecimal,
  formatHourMinute,
  formatInteger,
  formatRelativeMinutes,
} from '@/lib/format';
import { formatFreshnessLabel } from '@/lib/freshness';
import { MESSAGE_CATALOGS } from '@/lib/i18n/messages';
import { networkMessages } from '@/lib/i18n/messages/network';
import { buildNetworkBriefing, SAME_SLOT_BASELINE_LABEL } from '@/lib/network-briefing';
import { fetchComparableNetworkBaseline } from '@/lib/network-briefing-baseline';
import { buildNetworkHealth } from '@/lib/network-health';
import { getStationSeoRows } from '@/lib/seo-stations';
import { loadHomePageData } from '@/server-functions/home.server';

const NOW = new Date('2026-04-01T12:00:00.000Z');
const LAST_UPDATED_AT = '2026-04-01T11:59:00.000Z';

function buildStations(criticalCount: number) {
  return Array.from({ length: 20 }, (_, index) => ({
    id: `station-${index + 1}`,
    name: `Estación ${index + 1}`,
    lat: 41.65,
    lon: -0.88,
    capacity: 24,
    bikesAvailable: index < criticalCount ? 0 : 10,
    anchorsFree: index < criticalCount ? 24 : 14,
    recordedAt: LAST_UPDATED_AT,
  }));
}

const input = {
  stations: buildStations(3),
  activeAlertsCount: 4,
  coverageDays: 141,
  lastUpdatedAt: LAST_UPDATED_AT,
  pipelineHealthy: true,
  baseline: { criticalStationsCount: 1, activeAlertsCount: 2, label: SAME_SLOT_BASELINE_LABEL },
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as { __href?: string }).__href;
});

describe('network i18n dictionary', () => {
  it('has an English entry for every Spanish key and the same placeholders', () => {
    const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const spanishKeys = Object.keys(networkMessages.es).sort();
    expect(Object.keys(networkMessages.en).sort()).toEqual(spanishKeys);
    for (const key of spanishKeys) {
      const es = networkMessages.es[key as keyof typeof networkMessages.es];
      const en = networkMessages.en[key as keyof typeof networkMessages.en] as string;
      expect(placeholders(en), key).toEqual(placeholders(es));
    }
  });

  it('is registered in the central catalog', () => {
    expect(MESSAGE_CATALOGS.es['network.health.label.green']).toBe('Red en estado óptimo');
    expect(MESSAGE_CATALOGS.en['network.health.label.green']).toBe('Network in good shape');
  });
});

describe('network health', () => {
  it('keeps the Spanish labels and descriptions byte for byte (default locale)', () => {
    const base = { stations: buildStations(3), lastUpdatedAt: LAST_UPDATED_AT };
    const yellow = buildNetworkHealth({ ...base, pipelineHealthy: true });
    expect(yellow.label).toBe('Afectaciones moderadas');
    expect(yellow.description).toBe('3 de 20 estaciones sin bicis o sin huecos libres (15%)');

    const down = buildNetworkHealth({ ...base, pipelineHealthy: false });
    expect(down.label).toBe('Incidencia generalizada');
    expect(down.description).toBe(
      '3 de 20 estaciones sin bicis o sin huecos libres (15%); la recogida de datos no está funcionando',
    );

    const both = buildNetworkHealth({
      ...base,
      pipelineHealthy: false,
      lastUpdatedAt: '2026-04-01T10:00:00.000Z',
      nowIso: NOW.toISOString(),
    });
    expect(both.description).toBe(
      '3 de 20 estaciones sin bicis o sin huecos libres (15%); la recogida de datos no está funcionando y la última actualización fue hace más de 30 minutos',
    );

    const green = buildNetworkHealth({ stations: buildStations(0), pipelineHealthy: true, lastUpdatedAt: LAST_UPDATED_AT });
    expect(green.label).toBe('Red en estado óptimo');
    const empty = buildNetworkHealth({ stations: [], pipelineHealthy: true, lastUpdatedAt: null });
    expect(empty.label).toBe('Sin datos ahora mismo');
    expect(empty.description).toBe('Todavía no hay estaciones con datos para evaluar la red.');
  });

  it('renders English labels and descriptions', () => {
    const base = { stations: buildStations(3), lastUpdatedAt: '2026-04-01T10:00:00.000Z', nowIso: NOW.toISOString() };
    const health = buildNetworkHealth({ ...base, pipelineHealthy: false, locale: 'en' });
    expect(health.label).toBe('Widespread disruption');
    expect(health.description).toBe(
      '3 of 20 stations with no bikes or no free docks (15%); data collection is not working and the last update was more than 30 minutes ago',
    );
    expect(
      buildNetworkHealth({ stations: [], pipelineHealthy: true, lastUpdatedAt: null, locale: 'en' }).label,
    ).toBe('No data right now');
  });
});

describe('network briefing', () => {
  it('keeps the Spanish sentences byte for byte (default locale)', () => {
    expect(buildNetworkBriefing(input)).toMatchObject({
      state: 'tense',
      current: 'Ahora mismo, 3 estaciones no tienen bicis o huecos libres.',
      comparison: 'Hay 2 estaciones más que en la misma franja de la semana anterior.',
      focus: 'La estación que más conviene revisar ahora es Estación 1.',
      alerts: 'Hay 4 alertas activas. Se puede comparar con la misma franja de la semana anterior.',
      dataQuality:
        'Datos actualizándose con normalidad; última actualización hace 1 min; cobertura de 141 días.',
      warning: null,
    });
    expect(buildNetworkBriefing(input, 'es')).toEqual(buildNetworkBriefing(input));
  });

  it('keeps the remaining Spanish variants (singular, fewer, same, no baseline, insufficient)', () => {
    const one = buildNetworkBriefing({
      ...input,
      stations: buildStations(1),
      activeAlertsCount: 1,
      coverageDays: 1,
      pipelineHealthy: false,
      baseline: { criticalStationsCount: 2, activeAlertsCount: null, label: 'ayer' },
    });
    expect(one.current).toBe('Ahora mismo, 1 estación no tiene bicis o huecos libres.');
    expect(one.comparison).toBe('Hay 1 estación menos que en ayer.');
    expect(one.alerts).toBe('Hay 1 alerta activa. Aún no se puede comparar su evolución.');
    expect(one.dataQuality).toBe(
      'Datos con una incidencia en la actualización; última actualización hace 1 min; cobertura de 1 día.',
    );

    const same = buildNetworkBriefing({
      ...input,
      stations: buildStations(0),
      baseline: { criticalStationsCount: 0, activeAlertsCount: null, label: 'ayer' },
    });
    expect(same.current).toBe('Ahora mismo todas las estaciones tienen bicis y huecos libres.');
    expect(same.comparison).toBe('Hay el mismo número que en ayer.');
    expect(same.focus).toBe('No hay ninguna estación que requiera atención especial ahora.');

    const none = buildNetworkBriefing({ ...input, baseline: null });
    expect(none.comparison).toBe('Aún no hay otro momento comparable para saber si la situación ha cambiado.');

    const insufficient = buildNetworkBriefing({ ...input, stations: [], coverageDays: 0, lastUpdatedAt: null });
    expect(insufficient).toMatchObject({
      state: 'insufficient',
      current: 'Ahora mismo no hay datos suficientes para resumir la red.',
      comparison: 'Todavía no se puede comparar con otro momento.',
      focus: 'No se puede destacar ninguna estación con los datos disponibles.',
      alerts: 'No se puede resumir el estado de las alertas con los datos disponibles.',
      dataQuality: 'Cobertura disponible: 0 días.',
      warning: 'Faltan datos para ofrecer un resumen fiable.',
    });
  });

  it('builds the English briefing', () => {
    expect(buildNetworkBriefing(input, 'en')).toMatchObject({
      state: 'tense',
      current: 'Right now, 3 stations have no bikes or no free docks.',
      comparison: 'There are 2 more stations than in the same time slot last week.',
      focus: 'The station most worth checking right now is Estación 1.',
      alerts: 'There are 4 active alerts. They can be compared with the same time slot last week.',
      dataQuality: 'Data updating normally; last update 1 min ago; coverage of 141 days.',
      warning: null,
    });
    expect(buildNetworkBriefing(input, 'en').health.label).toBe('Moderate disruptions');

    const one = buildNetworkBriefing(
      {
        ...input,
        stations: buildStations(1),
        activeAlertsCount: 1,
        coverageDays: 1,
        baseline: { criticalStationsCount: 2, activeAlertsCount: null, label: 'yesterday' },
      },
      'en',
    );
    expect(one.current).toBe('Right now, 1 station has no bikes or no free docks.');
    expect(one.comparison).toBe('There is 1 fewer station than in yesterday.');
    expect(one.alerts).toBe('There is 1 active alert. Its trend cannot be compared yet.');
    expect(one.dataQuality).toContain('coverage of 1 day.');

    const insufficient = buildNetworkBriefing({ ...input, stations: [], coverageDays: 0, lastUpdatedAt: null }, 'en');
    expect(insufficient.current).toBe('There is not enough data right now to summarise the network.');
    expect(insufficient.dataQuality).toBe('Available coverage: 0 days.');
    expect(insufficient.warning).toBe('Data is missing to offer a reliable summary.');
  });

  it('renders the English hero under /en with English briefing, health and number formats', () => {
    (globalThis as { __href?: string }).__href = '/en';
    const briefing = buildNetworkBriefing(input, 'en');
    const html = renderToStaticMarkup(
      <HomeStatusHero
        briefing={briefing}
        health={briefing.health}
        bikesAvailable={12345}
        anchorsFreeTotal={352}
        activeStationsCount={20}
        criticalStationsCount={3}
        topCriticalDistricts={[]}
        generatedAt={LAST_UPDATED_AT}
      />,
    );
    expect(html).toContain('Moderate disruptions');
    expect(html).toContain('Right now, 3 stations have no bikes or no free docks.');
    expect(html).toContain(briefing.health.description);
    expect(html).toContain('12,345');
    expect(html).not.toContain('Afectaciones');
  });
});

describe('format helpers', () => {
  it('keeps the Spanish output unchanged by default', () => {
    expect(formatInteger(12345)).toBe('12.345');
    expect(formatInteger(1234)).toBe(new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(1234));
    expect(formatDecimal(3.25)).toBe('3,3');
    expect(formatDecimal(12.34)).toBe('12,3');
    expect(formatDecimal(null)).toBe('—');
    expect(formatHourMinute('2026-04-01T12:05:00.000Z')).toBe('14:05');
    expect(formatHourMinute('nope')).toBe('Sin datos');
    expect(formatRelativeMinutes(null)).toBe('sin datos');
    expect(formatRelativeMinutes(0.2)).toBe('hace menos de 1 min');
    expect(formatRelativeMinutes(5)).toBe('hace 5 min');
    expect(formatRelativeMinutes(60)).toBe('hace 1 h');
    expect(formatRelativeMinutes(180)).toBe('hace 3 h');
    expect(formatAlertType('LOW_BIKES')).toBe('Pocas bicis');
    expect(formatAlertType('LOW_ANCHORS')).toBe('Pocos anclajes');
    expect(formatAlertType('x')).toBe('Alerta desconocida');
    expect(formatDayType('WEEKDAY')).toBe('Entre semana');
    expect(formatDayType('WEEKEND')).toBe('Fin de semana');
    expect(formatDayType(null)).toBe('Día desconocido');
    expect(formatFreshnessLabel(null)).toBe('sin datos');
    expect(formatFreshnessLabel('2026-04-01T11:40:00.000Z')).toBe('desconectado');
    expect(formatFreshnessLabel('2026-04-01T11:57:00.000Z')).toBe('hace 3 min');
  });

  it('formats in English when asked', () => {
    expect(formatInteger(12345, 'en')).toBe('12,345');
    expect(formatDecimal(3.25, 'en')).toBe('3.3');
    expect(formatHourMinute('2026-04-01T12:05:00.000Z', undefined, 'en')).toBe('02:05 PM');
    expect(formatHourMinute('nope', undefined, 'en')).toBe('No data');
    expect(formatRelativeMinutes(null, 'en')).toBe('no data');
    expect(formatRelativeMinutes(0.2, 'en')).toBe('less than 1 min ago');
    expect(formatRelativeMinutes(5, 'en')).toBe('5 min ago');
    expect(formatRelativeMinutes(60, 'en')).toBe('1 h ago');
    expect(formatRelativeMinutes(180, 'en')).toBe('3 h ago');
    expect(formatAlertType('LOW_BIKES', 'en')).toBe('Few bikes');
    expect(formatDayType('WEEKDAY', 'en')).toBe('Weekdays');
    expect(formatDayType('WEEKEND', 'en')).toBe('Weekends');
    expect(formatFreshnessLabel('2026-04-01T11:40:00.000Z', 'en')).toBe('disconnected');
    expect(formatFreshnessLabel('2026-04-01T11:57:00.000Z', 'en')).toBe('3 min ago');
  });
});

const homeLoader = HomeRoute.options.loader as unknown as (opts: {
  context: { locale: 'es' | 'en' };
}) => ReturnType<typeof loadHomePageData>;

describe('home loader', () => {
  function mockHomeSources() {
    const stations = buildStations(3).map((station) => ({
      station,
      districtName: null,
      districtSlug: null,
      turnover: null,
      availability: null,
      currentOccupancy: 0.5,
    }));
    vi.mocked(getStationSeoRows).mockResolvedValue(stations as never);
    vi.mocked(fetchStatus).mockResolvedValue({
      quality: { freshness: { lastUpdated: LAST_UPDATED_AT } },
      pipeline: { healthStatus: 'healthy' },
    } as never);
    vi.mocked(fetchSharedDatasetSnapshot).mockResolvedValue({
      coverage: { totalDays: 141 },
      lastUpdated: { lastSampleAt: LAST_UPDATED_AT },
    } as never);
    vi.mocked(fetchAlerts).mockResolvedValue({ limit: 20, alerts: [], generatedAt: LAST_UPDATED_AT } as never);
    vi.mocked(fetchComparableNetworkBaseline).mockResolvedValue({
      criticalStationsCount: 1,
      activeAlertsCount: null,
      label: SAME_SLOT_BASELINE_LABEL,
    });
  }

  it('produces the Spanish summary by default', async () => {
    mockHomeSources();
    const data = await loadHomePageData();
    expect(data.briefing.current).toBe('Ahora mismo, 3 estaciones no tienen bicis o huecos libres.');
    expect(data.health.label).toBe('Afectaciones moderadas');
  });

  it('produces the English summary when the route context is en', async () => {
    mockHomeSources();
    const data = await homeLoader({ context: { locale: 'en' } });
    expect(data.briefing.current).toBe('Right now, 3 stations have no bikes or no free docks.');
    expect(data.briefing.comparison).toBe('There are 2 more stations than in the same time slot last week.');
    expect(data.health.label).toBe('Moderate disruptions');
    expect(data.health.description).toBe('3 of 20 stations with no bikes or no free docks (15%)');
  });

  it('keeps Spanish when the route context is es', async () => {
    mockHomeSources();
    const data = await homeLoader({ context: { locale: 'es' } });
    expect(data.briefing.current).toBe('Ahora mismo, 3 estaciones no tienen bicis o huecos libres.');
  });
});
