import { createServerFn } from '@tanstack/react-start';
import { FAQ_ITEMS } from '@/app/dashboard/ayuda/_components/help-center-content';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { isValidMonthKey } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { getCityName, getSiteUrl, SEO_SITE_NAME } from '@/lib/site';
import { fetchAvailableDataMonths, fetchHistoryMetadata, fetchSharedDatasetSnapshot, fetchStatus } from '@/lib/api';
import { buildFallbackAvailableMonths } from '@/lib/shared-data-fallbacks';
import {
  buildFallbackDatasetSnapshot,
  buildFallbackHistoryMetadata,
  buildFallbackStatus,
  getSharedDataSource,
} from '@/services/shared-data';

const FAQ_IDS = [
  'fuente-datos',
  'actualizacion',
  'demanda-no-viajes-reales',
  'prediccion-que-es',
] as const;

function getMethodologyFaqItems() {
  return FAQ_IDS.flatMap((id) => FAQ_ITEMS.filter((item) => item.id === id));
}

export const getMethodologyPageData = createServerFn({ method: 'GET' }).handler(async () => {

  const nowIso = new Date().toISOString();
  const [historyMeta, dataset, status, monthsResponse] = await Promise.all([
    fetchHistoryMetadata().catch(() => {
      const dataSource = getSharedDataSource();
      return buildFallbackHistoryMetadata(nowIso, dataSource);
    }),
    fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
    fetchStatus().catch(() => buildFallbackStatus(nowIso)),
    fetchAvailableDataMonths().catch(() => buildFallbackAvailableMonths(nowIso)),
  ]);
  const months = monthsResponse.months.filter(isValidMonthKey);
  const latestMonth = months[0] ?? null;
  const cityName = getCityName();
  const siteUrl = getSiteUrl();
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Metodología',
    href: appRoutes.methodology(),
  });
  const faqItems = getMethodologyFaqItems();

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'TechArticle',
        headline: `Metodología y calidad de datos de Bizi ${cityName}`,
        name: `Metodología y calidad de datos de Bizi ${cityName}`,
        description:
          'Guía pública para interpretar la fuente, la cobertura, la frecuencia y las métricas de las páginas públicas de DatosBizi.',
        url: `${siteUrl}${appRoutes.methodology()}`,
        inLanguage: 'es-ES',
        dateModified: dataset.coverage.generatedAt ?? historyMeta.generatedAt ?? nowIso,
        author: {
          '@type': 'Organization',
          name: SEO_SITE_NAME,
          url: siteUrl,
        },
        publisher: {
          '@type': 'Organization',
          name: SEO_SITE_NAME,
          url: siteUrl,
        },
      },
      {
        '@type': 'Dataset',
        name: `Dataset Bizi ${cityName}`,
        description:
          'Cobertura histórica, snapshot actual y criterios de interpretación del dataset usado por estaciones, barrios, informes y API.',
        url: `${siteUrl}${appRoutes.methodology()}`,
        inLanguage: 'es-ES',
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
