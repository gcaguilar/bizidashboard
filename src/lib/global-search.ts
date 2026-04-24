import 'server-only';

import { cache } from 'react';
import { fetchAvailableDataMonths, fetchStations } from '@/lib/api';
import { formatMonthLabel, isValidMonthKey } from '@/lib/months';
import { openApiDocument } from '@/lib/openapi-document';
import { PUBLIC_NAV_ITEMS } from '@/lib/public-navigation';
import { appRoutes } from '@/lib/routes';
import { getDistrictSeoRows } from '@/lib/seo-districts';
import { getSeoPageConfig, PRIMARY_SEO_PAGE_SLUGS } from '@/lib/seo-pages';

type GlobalSearchGroupId = 'stations' | 'districts' | 'reports' | 'pages' | 'api';

export type GlobalSearchEntry = {
  id: string;
  group: GlobalSearchGroupId;
  title: string;
  description: string;
  href: string;
  badge: string;
  keywords: string[];
};

export type GlobalSearchResult = GlobalSearchEntry & {
  score: number;
};

export type GlobalSearchGroup = {
  id: GlobalSearchGroupId;
  title: string;
  emptyLabel: string;
  results: GlobalSearchResult[];
};

export type GlobalSearchResponse = {
  query: string;
  normalizedQuery: string;
  totalMatches: number;
  groups: GlobalSearchGroup[];
};

const GROUP_META: Record<
  GlobalSearchGroupId,
  { title: string; emptyLabel: string }
> = {
  stations: {
    title: 'Estaciones',
    emptyLabel: 'No hay estaciones que encajen con esta busqueda.',
  },
  districts: {
    title: 'Barrios',
    emptyLabel: 'No hay barrios que encajen con esta busqueda.',
  },
  reports: {
    title: 'Informes',
    emptyLabel: 'No hay informes o periodos que encajen con esta busqueda.',
  },
  pages: {
    title: 'Paginas y herramientas',
    emptyLabel: 'No hay paginas publicas relevantes para esta busqueda.',
  },
  api: {
    title: 'API y developers',
    emptyLabel: 'No hay endpoints o recursos API que encajen con esta busqueda.',
  },
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9/]+/gu, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/\s+/u)
    .filter(Boolean);
}

function scoreEntry(entry: GlobalSearchEntry, query: string): number {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const tokens = tokenize(query);
  const primary = normalizeText(`${entry.title} ${entry.badge}`);
  const secondary = normalizeText(
    `${entry.description} ${entry.keywords.join(' ')} ${entry.href}`
  );
  const combined = `${primary} ${secondary}`.trim();

  if (!tokens.every((token) => combined.includes(token))) {
    return 0;
  }

  let score = 0;

  if (primary === normalizedQuery) {
    score += 120;
  } else if (primary.startsWith(normalizedQuery)) {
    score += 90;
  } else if (primary.includes(normalizedQuery)) {
    score += 65;
  } else if (secondary.includes(normalizedQuery)) {
    score += 35;
  }

  for (const token of tokens) {
    if (primary.startsWith(token)) {
      score += 18;
    } else if (primary.includes(token)) {
      score += 12;
    } else if (secondary.includes(token)) {
      score += 5;
    }
  }

  return score;
}

function sortResults(left: GlobalSearchResult, right: GlobalSearchResult): number {
  return (
    right.score - left.score ||
    left.title.localeCompare(right.title, 'es', { sensitivity: 'base' })
  );
}

export function buildDeveloperEndpointAnchorId(
  path: string,
  method: string
): string {
  const normalized = `${method}-${path}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');

  return `endpoint-${normalized}`;
}

const getGlobalSearchEntries = cache(async (): Promise<GlobalSearchEntry[]> => {
  const nowIso = new Date().toISOString();
  const [stations, districts, availableMonths] = await Promise.all([
    fetchStations().catch(() => ({
      stations: [],
      generatedAt: nowIso,
      dataState: 'no_coverage' as const,
    })),
    getDistrictSeoRows().catch(() => []),
    fetchAvailableDataMonths().catch(() => ({ months: [], generatedAt: nowIso })),
  ]);

  const pageEntries: GlobalSearchEntry[] = [
    ...PUBLIC_NAV_ITEMS.map((item) => ({
      id: `page:${item.id}`,
      group: 'pages' as const,
      title: item.label,
      description:
        item.id === 'help'
          ? 'Guia publica sobre fuente de datos, frescura, metodologia y limites de interpretacion.'
          : item.id === 'explore'
            ? 'Hub publico para descubrir herramientas, mapas, rankings, comparativas y lecturas del sistema.'
            : item.id === 'dashboard'
              ? 'Producto operativo en tiempo real con mapa, alertas, flujo y herramientas de analisis.'
          : `Acceso publico a ${item.label.toLowerCase()}.`,
      href: item.href,
      badge: 'Pagina publica',
      keywords:
        item.id === 'help'
          ? [item.label, item.href, 'metodologia', 'calidad datos', 'gbfs', 'faq']
          : item.id === 'explore'
            ? [item.label, item.href, 'explorar', 'herramientas', 'rankings', 'comparador']
            : item.id === 'dashboard'
              ? [item.label, item.href, 'mapa', 'alertas', 'dashboard', 'operaciones']
          : [item.label, item.href],
    })),
    {
      id: 'page:biciradar',
      group: 'pages',
      title: 'Landing Bici Radar',
      description:
        'Presentacion de la app, ciudades soportadas y enlaces de descarga.',
      href: appRoutes.biciradar(),
      badge: 'Landing publica',
      keywords: ['biciradar', 'app', 'movil', 'descarga'],
    },
    {
      id: 'page:utility-landing',
      group: 'pages',
      title: 'Mapa y estaciones Bizi Zaragoza en tiempo real',
      description:
        'Landing de utilidad inmediata para revisar disponibilidad y abrir el mapa en vivo.',
      href: appRoutes.utilityLanding(),
      badge: 'Landing captacion',
      keywords: ['mapa bizi zaragoza', 'estaciones en tiempo real', 'disponibilidad bizi'],
    },
    {
      id: 'page:insights-landing',
      group: 'pages',
      title: 'Estadisticas y ranking de Bizi Zaragoza',
      description:
        'Landing de descubrimiento para entrar por informes, rankings y barrios.',
      href: appRoutes.insightsLanding(),
      badge: 'Landing captacion',
      keywords: ['estadisticas bizi zaragoza', 'ranking bizi', 'informes bizi'],
    },
    {
      id: 'page:compare-stations',
      group: 'pages',
      title: 'Comparador de estaciones',
      description:
        'Comparativas manuales estacion vs estacion con URL compartible.',
      href: appRoutes.compare({ dimension: 'stations' }),
      badge: 'Comparador',
      keywords: ['comparar estaciones', 'station vs station', 'comparador'],
    },
    {
      id: 'page:compare-districts',
      group: 'pages',
      title: 'Comparador de barrios',
      description:
        'Comparativas manuales barrio vs barrio con el mismo dataset compartido.',
      href: appRoutes.compare({ dimension: 'districts' }),
      badge: 'Comparador',
      keywords: ['comparar barrios', 'distritos', 'comparador barrios'],
    },
    {
      id: 'page:compare-periods',
      group: 'pages',
      title: 'Comparador de periodos',
      description:
        'Comparativas entre periodos, meses, anos y horas desde una unica vista.',
      href: appRoutes.compare({ dimension: 'periods' }),
      badge: 'Comparador',
      keywords: ['periodos', 'mes vs mes', 'ano vs ano', 'hora vs hora'],
    },
    ...PRIMARY_SEO_PAGE_SLUGS.map((slug) => {
      const page = getSeoPageConfig(slug);

      return {
      id: `page:seo:${page.slug}`,
      group: 'pages' as const,
      title: page.title,
      description: page.description,
      href: appRoutes.seoPage(page.slug),
      badge: 'Landing SEO',
      keywords: [page.slug, page.metadataTitle, ...page.keywords],
      };
    }),
  ];

  const stationEntries: GlobalSearchEntry[] = stations.stations.map((station) => ({
    id: `station:${station.id}`,
    group: 'stations',
    title: station.name,
    description: `Estacion ${station.id} · ${station.bikesAvailable}/${station.capacity} bicis · ${station.anchorsFree} huecos libres.`,
    href: appRoutes.stationDetail(station.id),
    badge: 'Estacion',
    keywords: [
      station.id,
      station.name,
      String(station.bikesAvailable),
      String(station.anchorsFree),
    ],
  }));

  const districtEntries: GlobalSearchEntry[] = districts.map((district) => ({
    id: `district:${district.slug}`,
    group: 'districts',
    title: district.name,
    description: `${district.stationCount} estaciones · ${district.bikesAvailable} bicis disponibles · giro medio ${district.avgTurnover}.`,
    href: appRoutes.districtDetail(district.slug),
    badge: 'Barrio',
    keywords: [
      district.slug,
      district.name,
      `${district.stationCount} estaciones`,
      `${district.avgTurnover}`,
    ],
  }));

  const reportEntries: GlobalSearchEntry[] = availableMonths.months
    .filter(isValidMonthKey)
    .map((month) => ({
      id: `report:${month}`,
      group: 'reports' as const,
      title: `Informe ${formatMonthLabel(month)}`,
      description: `Informe mensual con demanda, ocupacion, balance y comparativas para ${formatMonthLabel(month)}.`,
      href: appRoutes.reportMonth(month),
      badge: 'Informe mensual',
      keywords: [month, formatMonthLabel(month), 'informes', 'archivo'],
    }));

  const apiEntries: GlobalSearchEntry[] = Object.entries(openApiDocument.paths)
    .flatMap(([path, operations]) =>
      Object.entries(operations).map(([method, operation]) => {
        const operationRecord = operation as {
          summary?: string;
          parameters?: Array<{ name?: string }>;
        };
        const anchorId = buildDeveloperEndpointAnchorId(path, method);
        return {
          id: `api:${method}:${path}`,
          group: 'api' as const,
          title: `${method.toUpperCase()} ${path}`,
          description:
            operationRecord.summary ??
            'Endpoint publicado en la documentacion OpenAPI.',
          href: `${appRoutes.developers()}#${anchorId}`,
          badge: 'Endpoint API',
          keywords: [
            path,
            method.toUpperCase(),
            method,
            ...(operationRecord.parameters ?? []).map((parameter) =>
              String(parameter.name ?? '')
            ),
          ],
        };
      })
    );

  return [
    ...stationEntries,
    ...districtEntries,
    ...reportEntries,
    ...pageEntries,
    ...apiEntries,
  ];
});

export async function searchGlobalContent(
  query: string,
  limitPerGroup = 6
): Promise<GlobalSearchResponse> {
  const entries = await getGlobalSearchEntries();
  const trimmedQuery = query.trim();
  const normalizedQuery = normalizeText(trimmedQuery);

  if (!normalizedQuery) {
    return {
      query: trimmedQuery,
      normalizedQuery,
      totalMatches: 0,
      groups: Object.entries(GROUP_META).map(([id, meta]) => ({
        id: id as GlobalSearchGroupId,
        title: meta.title,
        emptyLabel: meta.emptyLabel,
        results: [],
      })),
    };
  }

  const matches = entries
    .map((entry) => ({
      ...entry,
      score: scoreEntry(entry, trimmedQuery),
    }))
    .filter((entry): entry is GlobalSearchResult => entry.score > 0)
    .sort(sortResults);

  const groups = (Object.keys(GROUP_META) as GlobalSearchGroupId[]).map((groupId) => ({
    id: groupId,
    title: GROUP_META[groupId].title,
    emptyLabel: GROUP_META[groupId].emptyLabel,
    results: matches
      .filter((entry) => entry.group === groupId)
      .slice(0, limitPerGroup),
  }));

  return {
    query: trimmedQuery,
    normalizedQuery,
    totalMatches: matches.length,
    groups,
  };
}
