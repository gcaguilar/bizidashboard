import type { MetadataRoute } from 'next';
import type { DashboardViewMode } from '@/lib/dashboard-modes';
import { getSiteUrl } from '@/lib/site';

export const CITY_SEGMENTS = ['zaragoza', 'madrid', 'barcelona'] as const;

type QueryValue = string | number | boolean | null | undefined;

type StaticRouteEntry = {
  id: string;
  href: string;
  label: string;
  sitemap: {
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
    priority: number;
  };
};

type RedirectEntry = {
  source: string;
  destination: string;
};

function encodeSegment(value: string): string {
  return encodeURIComponent(value);
}

function buildQuery(pathname: string, query?: Record<string, QueryValue>): string {
  if (!query) {
    return pathname;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }

    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString.length > 0 ? `${pathname}?${queryString}` : pathname;
}

function buildHash(pathname: string, hash?: string | null): string {
  if (!hash) {
    return pathname;
  }

  const normalizedHash = hash.replace(/^#/, '');
  return normalizedHash.length > 0 ? `${pathname}#${normalizedHash}` : pathname;
}

export const appRoutes = {
  home: () => '/',
  homeAlias: () => '/inicio',
  citiesAlias: () => '/ciudades',
  cityRootAlias: (city: string) => `/${encodeSegment(city)}`,
  cityDashboardAlias: (city: string) => `/${encodeSegment(city)}/dashboard`,
  cityExploreAlias: (city: string) => `/${encodeSegment(city)}/explorar`,
  cityReportsAlias: (city: string) => `/${encodeSegment(city)}/informes`,
  cityStatusAlias: (city: string) => `/${encodeSegment(city)}/estado`,
  cityHelpAlias: (city: string) => `/${encodeSegment(city)}/ayuda`,
  cityFlowAlias: (city: string) => `/${encodeSegment(city)}/flujo`,
  cityConclusionsAlias: (city: string) => `/${encodeSegment(city)}/conclusiones`,
  cityAlertsAlias: (city: string) => `/${encodeSegment(city)}/alertas`,
  cityStationsAlias: (city: string) => `/${encodeSegment(city)}/estaciones`,
  beta: () => '/beta',
  biciradar: () => '/biciradar',
  compare: (params?: {
    dimension?: string | null;
    left?: string | null;
    right?: string | null;
  }) =>
    buildQuery('/comparar', {
      dimension: params?.dimension,
      left: params?.left,
      right: params?.right,
    }),
  developers: () => '/developers',
  developersAlias: () => '/developers',
  helpAlias: () => '/ayuda',
  methodologyAlias: () => '/metodologia',
  explore: (params?: { q?: string | null }) =>
    buildQuery('/explorar', { q: params?.q }),
  reports: () => '/informes',
  reportMonth: (month: string) => `/informes/${encodeSegment(month)}`,
  status: () => '/estado',
  dashboard: () => '/dashboard',
  dashboardAlerts: () => '/dashboard/alertas',
  dashboardHelp: (hash?: string | null) => buildHash('/dashboard/ayuda', hash),
  dashboardConclusions: (params?: { month?: string | null }) =>
    buildQuery('/dashboard/conclusiones', { month: params?.month }),
  dashboardFlow: (params?: { month?: string | null; period?: string | null }) =>
    buildQuery('/dashboard/flujo', { month: params?.month, period: params?.period }),
  dashboardStations: () => '/dashboard/estaciones',
  dashboardStation: (stationId: string) =>
    `/dashboard/estaciones/${encodeSegment(stationId)}`,
  dashboardStatus: () => '/dashboard/status',
  dashboardView: (mode: DashboardViewMode | string) =>
    `/dashboard/views/${encodeSegment(mode)}`,
  dashboardRedistribucion: () => '/dashboard/redistribucion',
  districtLanding: () => '/barrios-bizi-zaragoza',
  districtDetail: (districtSlug: string) => `/barrios/${encodeSegment(districtSlug)}`,
  seoPage: (slug: string) => `/${encodeSegment(slug)}`,
  api: {
    docs: () => '/api/docs',
    openApi: () => '/api/openapi.json',
    stations: (params?: { format?: 'csv' | null }) =>
      buildQuery('/api/stations', { format: params?.format }),
    rankings: (params?: {
      type?: string | null;
      limit?: number | null;
      format?: 'csv' | null;
    }) =>
      buildQuery('/api/rankings', {
        type: params?.type,
        limit: params?.limit,
        format: params?.format,
      }),
    alerts: (params?: { limit?: number | null }) =>
      buildQuery('/api/alerts', { limit: params?.limit }),
    status: (params?: { format?: 'csv' | null }) =>
      buildQuery('/api/status', { format: params?.format }),
    mobility: (params?: {
      mobilityDays?: number | null;
      demandDays?: number | null;
      month?: string | null;
    }) =>
      buildQuery('/api/mobility', {
        mobilityDays: params?.mobilityDays,
        demandDays: params?.demandDays,
        month: params?.month,
      }),
    history: (params?: { format?: 'csv' | null }) =>
      buildQuery('/api/history', { format: params?.format }),
    historyCsv: () => buildQuery('/api/history', { format: 'csv' }),
    alertsHistory: (params?: {
      format?: 'csv' | null;
      state?: string | null;
      limit?: number | null;
    }) =>
      buildQuery('/api/alerts/history', {
        format: params?.format,
        state: params?.state,
        limit: params?.limit,
      }),
    predictions: (stationId = '101') => buildQuery('/api/predictions', { stationId }),
    rebalancingReport: (params?: {
      district?: string | null;
      days?: number | null;
      format?: 'csv' | null;
    }) =>
      buildQuery('/api/rebalancing-report', {
        district: params?.district,
        days: params?.days,
        format: params?.format,
      }),
  },
} as const;

export const DASHBOARD_ROUTE_CONFIG = {
  dashboard: {
    href: appRoutes.dashboard(),
    label: 'Inicio',
  },
  stations: {
    href: appRoutes.dashboardStations(),
    label: 'Estaciones',
  },
  flow: {
    href: appRoutes.dashboardFlow(),
    label: 'Flujo',
  },
  conclusions: {
    href: appRoutes.dashboardConclusions(),
    label: 'Conclusiones',
  },
  redistribucion: {
    href: appRoutes.dashboardRedistribucion(),
    label: 'Redistribución',
  },
  help: {
    href: appRoutes.dashboardHelp(),
    label: 'Ayuda',
  },
} as const;

export const STATIC_PUBLIC_ROUTE_REGISTRY: StaticRouteEntry[] = [
  {
    id: 'home',
    href: appRoutes.home(),
    label: 'Inicio',
    sitemap: {
      changeFrequency: 'hourly',
      priority: 1,
    },
  },
  {
    id: 'beta',
    href: appRoutes.beta(),
    label: 'Beta',
    sitemap: {
      changeFrequency: 'weekly',
      priority: 0.85,
    },
  },
  {
    id: 'biciradar',
    href: appRoutes.biciradar(),
    label: 'Bici Radar',
    sitemap: {
      changeFrequency: 'weekly',
      priority: 0.76,
    },
  },
  {
    id: 'compare',
    href: appRoutes.compare(),
    label: 'Comparar',
    sitemap: {
      changeFrequency: 'daily',
      priority: 0.78,
    },
  },
  {
    id: 'developers',
    href: appRoutes.developers(),
    label: 'Developers',
    sitemap: {
      changeFrequency: 'weekly',
      priority: 0.72,
    },
  },
  {
    id: 'reports',
    href: appRoutes.reports(),
    label: 'Informes',
    sitemap: {
      changeFrequency: 'daily',
      priority: 0.82,
    },
  },
  {
    id: 'explore',
    href: appRoutes.explore(),
    label: 'Explorar',
    sitemap: {
      changeFrequency: 'daily',
      priority: 0.84,
    },
  },
  {
    id: 'district-landing',
    href: appRoutes.districtLanding(),
    label: 'Barrios',
    sitemap: {
      changeFrequency: 'daily',
      priority: 0.72,
    },
  },
  {
    id: 'dashboard',
    href: appRoutes.dashboard(),
    label: 'Dashboard',
    sitemap: {
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  },
  {
    id: 'dashboard-flow',
    href: appRoutes.dashboardFlow(),
    label: 'Flujo',
    sitemap: {
      changeFrequency: 'hourly',
      priority: 0.8,
    },
  },
  {
    id: 'dashboard-alerts',
    href: appRoutes.dashboardAlerts(),
    label: 'Alertas',
    sitemap: {
      changeFrequency: 'hourly',
      priority: 0.8,
    },
  },
  {
    id: 'dashboard-stations',
    href: appRoutes.dashboardStations(),
    label: 'Estaciones',
    sitemap: {
      changeFrequency: 'daily',
      priority: 0.7,
    },
  },
  {
    id: 'status',
    href: appRoutes.status(),
    label: 'Estado',
    sitemap: {
      changeFrequency: 'hourly',
      priority: 0.68,
    },
  },
  {
    id: 'dashboard-help',
    href: appRoutes.dashboardHelp(),
    label: 'Ayuda',
    sitemap: {
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  },
  {
    id: 'dashboard-conclusions',
    href: appRoutes.dashboardConclusions(),
    label: 'Conclusiones',
    sitemap: {
      changeFrequency: 'daily',
      priority: 0.75,
    },
  },
];

const EXACT_REDIRECT_ENTRIES: RedirectEntry[] = [
  {
    source: '/estaciones-mas-usadas',
    destination: appRoutes.seoPage('estaciones-mas-usadas-zaragoza'),
  },
  {
    source: appRoutes.dashboardStatus(),
    destination: appRoutes.status(),
  },
  {
    source: appRoutes.homeAlias(),
    destination: appRoutes.home(),
  },
  {
    source: appRoutes.citiesAlias(),
    destination: appRoutes.home(),
  },
  {
    source: appRoutes.helpAlias(),
    destination: appRoutes.dashboardHelp(),
  },
  {
    source: appRoutes.methodologyAlias(),
    destination: appRoutes.dashboardHelp(),
  },
  ...CITY_SEGMENTS.flatMap((city) => [
    {
      source: appRoutes.cityRootAlias(city),
      destination: appRoutes.dashboard(),
    },
    {
      source: appRoutes.cityDashboardAlias(city),
      destination: appRoutes.dashboard(),
    },
    {
      source: appRoutes.cityExploreAlias(city),
      destination: appRoutes.explore(),
    },
    {
      source: appRoutes.cityReportsAlias(city),
      destination: appRoutes.reports(),
    },
    {
      source: appRoutes.cityStatusAlias(city),
      destination: appRoutes.status(),
    },
    {
      source: appRoutes.cityHelpAlias(city),
      destination: appRoutes.dashboardHelp(),
    },
    {
      source: appRoutes.cityFlowAlias(city),
      destination: appRoutes.dashboardFlow(),
    },
    {
      source: appRoutes.cityConclusionsAlias(city),
      destination: appRoutes.dashboardConclusions(),
    },
    {
      source: appRoutes.cityAlertsAlias(city),
      destination: appRoutes.dashboardAlerts(),
    },
    {
      source: appRoutes.cityStationsAlias(city),
      destination: appRoutes.dashboardStations(),
    },
  ]),
];

const EXACT_REDIRECT_MAP = new Map(EXACT_REDIRECT_ENTRIES.map((entry) => [entry.source, entry.destination]));

export function getExactRedirectEntries(): RedirectEntry[] {
  return EXACT_REDIRECT_ENTRIES;
}

export function resolveRedirectTarget(pathname: string): string | null {
  const directTarget = EXACT_REDIRECT_MAP.get(pathname);

  if (directTarget) {
    return directTarget;
  }

  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (!firstSegment || !CITY_SEGMENTS.includes(firstSegment as (typeof CITY_SEGMENTS)[number])) {
    return null;
  }

  const strippedPath = segments.length === 1 ? appRoutes.dashboard() : `/${segments.slice(1).join('/')}`;
  return EXACT_REDIRECT_MAP.get(strippedPath) ?? strippedPath;
}

export function toAbsoluteRouteUrl(pathname: string): string {
  return `${getSiteUrl()}${pathname}`;
}
