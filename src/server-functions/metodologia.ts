import { createServerFn } from '@tanstack/react-start';
import { FAQ_ITEMS } from '@/app/dashboard/ayuda/_components/help-center-content';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { isValidMonthKey } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { getCityName, getSiteUrl, SITE_NAME } from '@/lib/site';
import type { HistoryMetadata } from '@/services/shared-data/types';

const FAQ_IDS = [
  'fuente-datos',
  'actualizacion',
  'demanda-no-viajes-reales',
  'prediccion-que-es',
] as const;

function buildFallbackHistoryMetadata(nowIso: string, source: string): HistoryMetadata {
  return {
    source,
    coverage: {
      firstRecordedAt: null,
      lastRecordedAt: null,
      totalSamples: 0,
      totalStations: 0,
      totalDays: 0,
      generatedAt: nowIso,
    },
    generatedAt: nowIso,
  };
}

function getMethodologyFaqItems() {
  return FAQ_IDS.flatMap((id) => FAQ_ITEMS.filter((item) => item.id === id));
}

export const getMethodologyPageData = createServerFn({ method: 'GET' }).handler(async () => {
  const [api, fallbacks, sharedData] = await Promise.all([
    import('@/lib/api'),
    import('@/lib/shared-data-fallbacks'),
    import('@/services/shared-data'),
  ]);
  const {
    fetchAvailableDataMonths,
    fetchHistoryMetadata,
    fetchSharedDatasetSnapshot,
    fetchStatus,
  } = api;
  const {
    buildFallbackAvailableMonths,
    buildFallbackDatasetSnapshot,
    buildFallbackStatus,
  } = fallbacks;
  const nowIso = new Date().toISOString();
  const [historyMeta, dataset, status, monthsResponse] = await Promise.all([
    fetchHistoryMetadata().catch(() =>
      buildFallbackHistoryMetadata(nowIso, sharedData.getSharedDataSource())
    ),
    fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
    fetchStatus().catch(() => buildFallbackStatus(nowIso)),
    fetchAvailableDataMonths().catch(() => buildFallbackAvailableMonths(nowIso)),
  ]);
  const months = monthsResponse.months.filter(isValidMonthKey);
  const latestMonth = months[0] ?? null;
  const cityName = getCityName();
  const siteUrl = getSiteUrl();
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Metodologia',
    href: appRoutes.methodology(),
  });
  const faqItems = getMethodologyFaqItems();

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'TechArticle',
        headline: `Metodologia y calidad de datos de Bizi ${cityName}`,
        name: `Metodologia y calidad de datos de Bizi ${cityName}`,
        description:
          'Guia publica para interpretar la fuente, la cobertura, la frecuencia y las metricas de las paginas publicas de DatosBizi.',
        url: `${siteUrl}${appRoutes.methodology()}`,
        inLanguage: 'es',
        dateModified: dataset.coverage.generatedAt ?? historyMeta.generatedAt ?? nowIso,
        author: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: siteUrl,
        },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: siteUrl,
        },
      },
      {
        '@type': 'Dataset',
        name: `Dataset Bizi ${cityName}`,
        description:
          'Cobertura historica, snapshot actual y criterios de interpretacion del dataset usado por estaciones, barrios, informes y API.',
        url: `${siteUrl}${appRoutes.methodology()}`,
        inLanguage: 'es',
        isAccessibleForFree: true,
        dateModified: dataset.coverage.generatedAt,
        distribution: [
          {
            '@type': 'DataDownload',
            name: 'OpenAPI JSON',
            encodingFormat: 'application/json',
            contentUrl: `${siteUrl}${appRoutes.api.openApi()}`,
          },
          {
            '@type': 'DataDownload',
            name: 'Historico CSV',
            encodingFormat: 'text/csv',
            contentUrl: `${siteUrl}${appRoutes.api.historyCsv()}`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };

  return {
    historyMeta,
    dataset,
    status,
    months,
    latestMonth,
    breadcrumbs,
    faqItems,
    structuredData,
  };
});
