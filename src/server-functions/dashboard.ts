import { createServerFn } from '@tanstack/react-start';
import type { AlertsResponse, RankingsResponse } from '@/lib/api-types';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { appRoutes } from '@/lib/routes';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { getSiteUrl, SITE_NAME, SITE_TITLE } from '@/lib/site';
import type { DashboardInitialData } from '@/app/dashboard/_components/DashboardClient';

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

export const getDashboardPageData = createServerFn({ method: 'GET' }).handler(async () => {
  const [api, fallbacks] = await Promise.all([
    import('@/lib/api'),
    import('@/lib/shared-data-fallbacks'),
  ]);
  const {
    fetchAlerts,
    fetchSharedDatasetSnapshot,
    fetchRankings,
    fetchStations,
    fetchStatus,
  } = api;
  const {
    buildFallbackDatasetSnapshot,
    buildFallbackStatus,
    buildFallbackStations,
  } = fallbacks;
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
    stations,
    status,
    alerts,
    rankings: {
      turnover,
      availability,
    },
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
