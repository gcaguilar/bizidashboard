import { createServerFn } from '@tanstack/react-start';
import type { AlertsResponse, RankingsResponse } from '@/lib/api-types';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { appRoutes } from '@/lib/routes';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { getSiteUrl, SITE_NAME, SITE_TITLE } from '@/lib/site';
import type { DashboardInitialData } from '@/app/dashboard/_components/DashboardClient';
import { fetchAlerts, fetchSharedDatasetSnapshot, fetchRankings, fetchStations, fetchStatus } from '@/lib/api';
import { buildFallbackDatasetSnapshot, buildFallbackStatus, buildFallbackStations } from '@/lib/shared-data-fallbacks';

type ErrorWithMeta = {
  cause?: unknown;
  meta?: {
    driverAdapterError?: unknown;
  };
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isMissingTableError(error: unknown): boolean {
  const message = toErrorMessage(error).toLowerCase();
  if (message.includes('no such table') || message.includes('p2021')) {
    return true;
  }

  if (error && typeof error === 'object') {
    const maybeError = error as ErrorWithMeta;

    if (maybeError.cause && isMissingTableError(maybeError.cause)) {
      return true;
    }

    if (
      maybeError.meta?.driverAdapterError &&
      isMissingTableError(maybeError.meta.driverAdapterError)
    ) {
      return true;
    }
  }

  return false;
}

function toStr(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return String(value);
}

function serializeStationsResponse(data: unknown): DashboardInitialData['stations'] {
  if (!data || typeof data !== 'object') {
    return { stations: [], generatedAt: new Date().toISOString(), dataState: 'empty' };
  }
  const d = data as Record<string, unknown>;
  const stations = Array.isArray(d.stations)
    ? d.stations.map((s: unknown) => {
        if (!s || typeof s !== 'object') return {} as DashboardInitialData['stations']['stations'][number];
        const obj = s as Record<string, unknown>;
        return {
          id: toStr(obj.id),
          name: toStr(obj.name),
          lat: typeof obj.lat === 'number' ? obj.lat : Number(obj.lat) || 0,
          lon: typeof obj.lon === 'number' ? obj.lon : Number(obj.lon) || 0,
          capacity: Number(obj.capacity) || 0,
          bikesAvailable: Number(obj.bikesAvailable) || 0,
          anchorsFree: Number(obj.anchorsFree) || 0,
          recordedAt: typeof obj.recordedAt === 'string' ? obj.recordedAt : new Date().toISOString(),
        };
      })
    : [];
  return {
    stations,
    generatedAt: typeof d.generatedAt === 'string' ? d.generatedAt : new Date().toISOString(),
    dataState: (d.dataState as DashboardInitialData['stations']['dataState']) ?? 'empty',
  };
}

function serializeAlertsResponse(data: unknown): DashboardInitialData['alerts'] {
  if (!data || typeof data !== 'object') {
    return { limit: 20, alerts: [], generatedAt: new Date().toISOString() };
  }
  const d = data as Record<string, unknown>;
  const alerts = Array.isArray(d.alerts) ? d.alerts : [];
  return {
    limit: Number(d.limit) || 20,
    alerts,
    generatedAt: typeof d.generatedAt === 'string' ? d.generatedAt : new Date().toISOString(),
  };
}

function makeEmptyRanking(type: string): DashboardInitialData['rankings']['turnover'] {
  return {
    type: type as 'turnover' | 'availability',
    limit: 50,
    rankings: [],
    districtSpotlight: [],
    generatedAt: new Date().toISOString(),
    dataState: 'no_coverage',
  };
}

function serializeRankingResponse(raw: Record<string, unknown>, type: string): DashboardInitialData['rankings']['turnover'] {
  const rankings = Array.isArray(raw.rankings) ? raw.rankings : [];
  const districtSpotlight = Array.isArray(raw.districtSpotlight) ? raw.districtSpotlight : [];
  return {
    type: type as 'turnover' | 'availability',
    limit: Number(raw.limit) || 50,
    rankings,
    districtSpotlight,
    generatedAt: typeof raw.generatedAt === 'string' ? raw.generatedAt : new Date().toISOString(),
    dataState: typeof raw.dataState === 'string' ? raw.dataState as 'ok' | 'no_coverage' | 'empty' : 'no_coverage',
  };
}

function serializeRankingsResponse(data: { turnover?: unknown; availability?: unknown }): DashboardInitialData['rankings'] {
  const turnoverRaw = (data.turnover as Record<string, unknown> | undefined) ?? makeEmptyRanking('turnover');
  const availabilityRaw = (data.availability as Record<string, unknown> | undefined) ?? makeEmptyRanking('availability');
  const turnover = serializeRankingResponse(turnoverRaw, 'turnover');
  const availability = serializeRankingResponse(availabilityRaw, 'availability');
  return { turnover, availability };
}

export const getDashboardPageData = createServerFn({ method: 'GET' }).handler(async () => {
  const siteUrl = getSiteUrl();
  const nowIso = new Date().toISOString();
  const fallbackStations = buildFallbackStations(nowIso);
  const fallbackStatus = buildFallbackStatus(nowIso);
  const fallbackDataset = buildFallbackDatasetSnapshot(nowIso);
  const fallbackAlerts: AlertsResponse = {
    limit: 20,
    alerts: [],
    generatedAt: nowIso,
  };
  const fallbackTurnover: RankingsResponse = {
    type: 'turnover',
    limit: 50,
    rankings: [],
    districtSpotlight: [],
    generatedAt: nowIso,
    dataState: 'no_coverage',
  };
  const fallbackAvailability: RankingsResponse = {
    type: 'availability',
    limit: 50,
    rankings: [],
    districtSpotlight: [],
    generatedAt: nowIso,
    dataState: 'no_coverage',
  };

  const loadErrors: string[] = [];
  const schemaMissingFlags: boolean[] = [];

  const withFallback = async <T,>(
    label: string,
    fetcher: () => Promise<T>,
    fallback: T
  ): Promise<T> => {
    try {
      return await fetcher();
    } catch (error) {
      const schemaMissing = isMissingTableError(error);
      captureExceptionWithContext(error, {
        area: 'dashboard.ssr',
        operation: 'DashboardPage.withFallback',
        tags: {
          panel: label,
          schemaMissing,
        },
        extra: {
          label,
        },
      });
      console.error(`[Dashboard] Error cargando ${label}:`, error);
      loadErrors.push(label);
      if (schemaMissing) {
        schemaMissingFlags.push(true);
      }
      return fallback;
    }
  };

  const [stations, dataset] = await Promise.all([
    withFallback('estaciones', fetchStations, fallbackStations),
    withFallback('metadatos compartidos', fetchSharedDatasetSnapshot, fallbackDataset),
  ]);

  const rankingLimit = Math.max(
    50,
    Math.min(200, stations.stations.length > 0 ? stations.stations.length : 50)
  );

  const [status, alerts, turnover, availability] = await Promise.all([
    withFallback('estado del sistema', fetchStatus, fallbackStatus),
    withFallback('alertas', () => fetchAlerts(20), fallbackAlerts),
    withFallback(
      'ranking de uso',
      () => fetchRankings('turnover', rankingLimit),
      { ...fallbackTurnover, limit: rankingLimit }
    ),
    withFallback(
      'ranking de disponibilidad',
      () => fetchRankings('availability', rankingLimit),
      { ...fallbackAvailability, limit: rankingLimit }
    ),
  ]);

  const initialData: DashboardInitialData = {
    dataset,
    stations: serializeStationsResponse(stations),
    status,
    alerts: serializeAlertsResponse(alerts),
    rankings: serializeRankingsResponse({ turnover, availability }),
  };

  const isSchemaMissing = schemaMissingFlags.length > 0;
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Dashboard',
    href: appRoutes.dashboard(),
  });
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'WebApplication',
        name: `${SITE_TITLE} Dashboard`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: `${siteUrl}${appRoutes.dashboard()}`,
        description:
          'Panel principal de Bizi Zaragoza con estado del sistema, mapa en tiempo real, demanda, rankings y flujo urbano.',
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: siteUrl,
        },
      },
      {
        '@type': 'Dataset',
        name: 'Estado y analitica del sistema Bizi Zaragoza',
        description:
          'Datos agregados de estaciones, alertas, demanda, ocupacion y salud del sistema para el dashboard principal.',
        url: `${siteUrl}${appRoutes.dashboard()}`,
        distribution: [
          { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${siteUrl}${appRoutes.api.stations()}` },
          { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: `${siteUrl}${appRoutes.api.stations()}?format=csv` },
          { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${siteUrl}${appRoutes.api.status()}` },
        ],
      },
    ],
  };

  return {
    breadcrumbs,
    initialData,
    isSchemaMissing,
    loadErrors,
    structuredData,
  };
});
