import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('@/components/StationFavoriteButton', () => ({
  StationFavoriteButton: () => <button type="button">star</button>,
}));

import { HomeDiagnosis } from '@/app/_components/home/HomeDiagnosis';
import { HomeExploreSection } from '@/app/_components/HomeExploreSection';
import { HomeStatusHero } from '@/app/_components/HomeStatusHero';
import { NearbyBikesCta } from '@/app/_components/home/NearbyBikesCta';
import { HomeMapSection } from '@/app/_components/home/HomeMapSection';
import { MapStationList } from '@/app/dashboard/_components/MapStationList';
import type { StationSnapshot } from '@/lib/api-types';
import {
  buildStationCurrentLabel,
  buildStationIssueLabel,
} from '@/lib/home-diagnosis';
import { createLocaleRewrite } from '@/lib/i18n/locale-rewrite';
import { getLocaleFromPathname, type Locale } from '@/lib/i18n/locales';
import { MESSAGE_CATALOGS, translate, type MessageKey } from '@/lib/i18n/messages';
import {
  CITIZEN_MAP_LEGEND,
  getCitizenMapLegend,
  getCitizenStatus,
  getCitizenStatusDetail,
} from '@/lib/map-colors';
import { getActivityIndexUnits } from '@/lib/product-copy';
import { getExploreHubSections } from '@/lib/public-navigation';
import exploreHubSpanish from './fixtures/explore-hub-es.json';

/** Renders `node` inside a real router (with the /en rewrite) at `path`. */
async function renderAt(path: string, node: ReactNode): Promise<string> {
  const rootRoute = createRootRoute({
    beforeLoad: ({ location }) => ({ locale: getLocaleFromPathname(location.publicHref) }),
    component: () => <>{node}</>,
  });
  const routeTree = rootRoute.addChildren([
    createRoute({ getParentRoute: () => rootRoute, path: '/' }),
    createRoute({ getParentRoute: () => rootRoute, path: '/estadisticas/estaciones/$stationId' }),
    createRoute({ getParentRoute: () => rootRoute, path: '/dashboard' }),
  ]);
  let routerRef: { latestLocation?: { publicHref?: string } } | undefined;
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    // Mirrors `src/router.tsx`: the rewrite reads the locale from the router itself.
    rewrite: createLocaleRewrite(() => routerRef?.latestLocation?.publicHref),
  });
  routerRef = router;
  await router.load();
  return renderToString(<RouterProvider router={router} />);
}

const stationA = {
  id: '101',
  name: 'Plaza Aragón',
  lat: 41.65,
  lon: -0.88,
  capacity: 20,
  bikesAvailable: 0,
  anchorsFree: 20,
  recordedAt: '2026-04-01T11:59:00.000Z',
} as unknown as StationSnapshot;

const summary = {
  station: stationA,
  districtName: 'Centro',
  districtSlug: 'centro',
  turnover: { turnoverScore: 120 },
  availability: { emptyHours: 60, fullHours: 10, totalHours: 100 },
  currentOccupancy: 0.12,
} as unknown as Parameters<typeof HomeDiagnosis>[0]['problemStations'][number];

describe('home sections keep their Spanish copy', () => {
  it('home-diagnosis helpers default to the original Spanish strings', () => {
    const availability = { emptyHours: 60, fullHours: 10, totalHours: 100 };
    expect(buildStationIssueLabel(availability)).toBe('Sin bicis el 60% del tiempo (últimos 14 días)');
    expect(buildStationIssueLabel({ emptyHours: 10, fullHours: 80, totalHours: 100 })).toBe(
      'Llena el 80% del tiempo (últimos 14 días)',
    );
    expect(buildStationCurrentLabel({ bikesAvailable: 7, anchorsFree: 3 })).toBe('Ahora: 7 bicis · 3 huecos');
    const base = { capacity: 20, bikesAvailable: 5, anchorsFree: 5 };
    expect(getCitizenStatusDetail({ ...base, capacity: 0 })).toBe('Sin datos');
    expect(getCitizenStatusDetail({ ...base, bikesAvailable: 0 })).toBe('Sin bicis');
    expect(getCitizenStatusDetail({ ...base, anchorsFree: 0 })).toBe('Sin huecos');
    expect(getCitizenStatusDetail({ ...base, anchorsFree: 2 })).toBe('Pocos huecos');
    expect(getCitizenStatusDetail(base)).toBe('Equilibrio');
  });

  it('citizen legend and statuses are untouched in Spanish', () => {
    expect(CITIZEN_MAP_LEGEND.map(({ level, label, description }) => ({ level, label, description }))).toEqual([
      { level: 'balanced', label: 'Equilibrio', description: '3 o más bicis y 3 o más huecos' },
      { level: 'low', label: 'Poca disponibilidad', description: 'menos de 3 bicis o menos de 3 huecos' },
      { level: 'depleted', label: 'Agotada', description: 'sin bicis o sin huecos' },
    ]);
    expect(getCitizenMapLegend('es')).toBe(CITIZEN_MAP_LEGEND);
    expect(getCitizenMapLegend()).toBe(CITIZEN_MAP_LEGEND);
    expect(getCitizenStatus(stationA, 'es')).toEqual(getCitizenStatus(stationA));
    expect(getCitizenStatus({ capacity: 0, bikesAvailable: 0, anchorsFree: 0 }).label).toBe('Sin datos');
  });

  it('the explore hub is byte-for-byte the previous Spanish output', () => {
    expect(getExploreHubSections()).toEqual(exploreHubSpanish.plain);
    expect(getExploreHubSections({ locale: 'es' })).toEqual(exploreHubSpanish.plain);
    expect(getExploreHubSections({ latestMonth: '2026-09' })).toEqual(exploreHubSpanish.month);
  });

  it('keeps the original Spanish strings of the child components', async () => {
    const html = await renderAt(
      '/',
      <>
        <HomeDiagnosis problemStations={[summary]} mostUsedStations={[summary]} filter="all" />
        <HomeExploreSection />
        <NearbyBikesCta />
        <NearbyBikesCta mode="anchors" />
      </>,
    );
    for (const text of [
      'Conviene revisar',
      'Más movimiento',
      'Sin bicis el 60% del tiempo (últimos 14 días)',
      'Zona de mucho movimiento',
      'ocupación',
      'El índice de actividad ayuda a comparar estaciones; no es el número oficial de viajes.',
      'Explora la red a tu manera',
      'Informes y análisis',
      'Bicis cerca de ti',
      '¿Dónde dejo la bici?',
    ]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('href="/estadisticas/estaciones/101"');
    expect(html).not.toContain('/en/');
  });
});

describe('home sections in English', () => {
  it('translates the diagnosis helpers and the legend, keeping colors and icons', () => {
    expect(buildStationIssueLabel({ emptyHours: 60, fullHours: 10, totalHours: 100 }, 'en')).toBe(
      'No bikes 60% of the time (last 14 days)',
    );
    expect(buildStationCurrentLabel({ bikesAvailable: 7, anchorsFree: 3 }, 'en')).toBe('Now: 7 bikes · 3 docks');
    expect(getCitizenStatusDetail({ capacity: 20, bikesAvailable: 0, anchorsFree: 5 }, 'en')).toBe('No bikes');

    const legend = getCitizenMapLegend('en');
    expect(legend.map((entry) => entry.label)).toEqual(['Balanced', 'Low availability', 'Depleted']);
    legend.forEach((entry, index) => {
      expect(entry.color).toBe(CITIZEN_MAP_LEGEND[index].color);
      expect(entry.icon).toBe(CITIZEN_MAP_LEGEND[index].icon);
      expect(entry.level).toBe(CITIZEN_MAP_LEGEND[index].level);
    });
    expect(getCitizenStatus({ capacity: 0, bikesAvailable: 0, anchorsFree: 0 }, 'en').label).toBe('No data');
  });

  it('translates the explore hub and keeps ids and hrefs', () => {
    const es = getExploreHubSections({ latestMonth: '2026-09' });
    const en = getExploreHubSections({ latestMonth: '2026-09', locale: 'en' });
    expect(en.map((section) => section.id)).toEqual(es.map((section) => section.id));
    expect(en[0].title).toBe('Operations and quick reading');
    en.forEach((section, i) => {
      section.items.forEach((item, j) => {
        expect(item.href).toBe(es[i].items[j].href);
        expect(item.description).not.toBe(es[i].items[j].description);
        expect(item.destinationLabel).not.toMatch(/Mapa|Página|Archivo/);
      });
    });
    expect(en[2].items[1].destinationLabel).toBe('Report 2026-09');
  });

  it('renders the diagnosis in English with station links under /en', async () => {
    const html = await renderAt(
      '/en',
      <HomeDiagnosis problemStations={[summary]} mostUsedStations={[summary]} filter="all" />,
    );
    expect(html).toContain('Worth checking');
    expect(html).toContain('Most movement');
    expect(html).toContain('No bikes 60% of the time (last 14 days)');
    expect(html).toContain('High-movement area');
    expect(html).toContain('occupancy');
    expect(html).toContain(getActivityIndexUnits('en').total);
    expect(html).toContain(getActivityIndexUnits('en').tooltipLabel);
    expect(html).toContain('href="/en/estadisticas/estaciones/101"');
    expect(html).not.toContain('href="/estadisticas/estaciones/101"');
    expect(html).not.toContain('Conviene revisar');
  });

  it('renders the status hero, explore section and nearby CTAs in English', async () => {
    const html = await renderAt(
      '/en',
      <>
        <HomeStatusHero
          briefing={{ current: 'Briefing' } as never}
          health={{ level: 'green', label: 'Healthy', description: 'ok' } as never}
          bikesAvailable={100}
          anchorsFreeTotal={50}
          activeStationsCount={10}
          criticalStationsCount={2}
          topCriticalDistricts={[
            { name: 'Centro' },
            { name: 'Delicias' },
            { name: 'Actur' },
          ] as never}
          generatedAt="2026-04-01T11:59:00.000Z"
        />
        <HomeExploreSection />
        <NearbyBikesCta />
        <NearbyBikesCta mode="anchors" />
      </>,
    );
    for (const text of [
      'Available bikes',
      'Free docks',
      'No bike or no dock',
      'worth checking',
      'Today&#x27;s reading',
      'Mostly concentrated in Centro, Delicias and Actur.',
      'See alerts',
      'Explore the network your way',
      'Reports and analysis',
      'Bikes near you',
      'Where do I leave the bike?',
    ]) {
      expect(html).toContain(text);
    }
    expect(html).not.toContain('Bicis disponibles');
    expect(html).not.toContain('Informes y análisis');
  });

  it('renders the map legend and floating CTA in English', async () => {
    const html = await renderAt('/en', <HomeMapSection stations={[]} />);
    expect(html).toContain('Balanced');
    expect(html).toContain('Depleted');
    expect(html).toContain('No stations match this filter.');
    expect(html).toContain('Bikes near you');
    expect(html).not.toContain('Agotada');
  });

  it('translates the keyboard station list', async () => {
    const html = await renderAt('/en', <MapStationList stations={[stationA]} onSelect={() => {}} />);
    expect(html).toContain('See map stations');
    expect(html).toContain('aria-label="Map stations"');
    expect(html).toContain('Depleted');
  });
});

describe('home dictionary', () => {
  const homeKeys = (Object.keys(MESSAGE_CATALOGS.es) as MessageKey[]).filter(
    (key) => key.startsWith('home.') || key.startsWith('explore.'),
  );

  it('has an English entry for every home and explore key', () => {
    const missing = homeKeys.filter((key) => !MESSAGE_CATALOGS.en[key]);
    expect(missing).toEqual([]);
  });

  it('keeps the same placeholders in both languages', () => {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of homeKeys) {
      expect(placeholders(MESSAGE_CATALOGS.en[key] ?? ''), key).toEqual(placeholders(MESSAGE_CATALOGS.es[key]));
    }
  });

  it('falls back to Spanish for a missing English key', () => {
    const locale: Locale = 'en';
    expect(translate(locale, 'home.live.title')).toBe('Search and filter the network');
    expect(translate('es', 'home.live.title')).toBe('Busca y filtra la red');
  });
});
