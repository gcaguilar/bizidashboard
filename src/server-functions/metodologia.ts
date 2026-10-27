import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { FAQ_ITEMS } from '@/app/dashboard/ayuda/_components/help-center-content';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { isValidMonthKey } from '@/lib/months';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/lib/i18n/locales';
import { translate } from '@/lib/i18n/messages';
import { appRoutes } from '@/lib/routes';
import { getCityName, getSiteUrl, SEO_SITE_NAME } from '@/lib/site';
import type { HistoryMetadata, SharedDatasetSnapshot } from '@/lib/api';
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

/** Schema.org language tag of the methodology JSON-LD nodes. */
const LD_LANGUAGE: Record<Locale, string> = { es: 'es-ES', en: 'en' };

/**
 * FAQ shared with the dashboard help center. Spanish is served straight from
 * `FAQ_ITEMS`; English comes from the dictionary indexed by item `id`.
 */
export function getMethodologyFaqItems(locale: Locale = DEFAULT_LOCALE) {
  const items = FAQ_IDS.flatMap((id) => FAQ_ITEMS.filter((item) => item.id === id));
  if (locale === DEFAULT_LOCALE) {
    return items;
  }
  return items.map((item) => {
    const id = item.id as (typeof FAQ_IDS)[number];
    return {
      ...item,
      question: translate(locale, `methodology.faq.${id}.question`),
      answer: translate(locale, `methodology.faq.${id}.answer`),
    };
  });
}

/** Locale-dependent content of the page: breadcrumbs, visible FAQ and JSON-LD. */
export function buildMethodologyContent(
  locale: Locale,
  dataset: Pick<SharedDatasetSnapshot, 'coverage'>,
  historyMeta: Pick<HistoryMetadata, 'generatedAt'>,
  nowIso: string
) {
  const cityName = getCityName();
  const siteUrl = getSiteUrl();
  const breadcrumbs = createRootBreadcrumbs({
    label: translate(locale, 'methodology.breadcrumb.self'),
    href: appRoutes.methodology(),
  });
  const localizedBreadcrumbs = breadcrumbs.map((item, index) =>
    index === 0 ? { ...item, label: translate(locale, 'station.breadcrumb.home') } : item
  );
  const faqItems = getMethodologyFaqItems(locale);
  const ldLanguage = LD_LANGUAGE[locale];
  const cityParams = { city: cityName };

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(localizedBreadcrumbs, locale),
      {
        '@type': 'TechArticle',
        headline: translate(locale, 'methodology.ld.article.headline', cityParams),
        name: translate(locale, 'methodology.ld.article.headline', cityParams),
        description: translate(locale, 'methodology.ld.article.description'),
        url: `${siteUrl}${appRoutes.methodology()}`,
        inLanguage: ldLanguage,
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
        name: translate(locale, 'methodology.ld.dataset.name', cityParams),
        description: translate(locale, 'methodology.ld.dataset.description'),
        url: `${siteUrl}${appRoutes.methodology()}`,
        inLanguage: ldLanguage,
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
            name: translate(locale, 'methodology.ld.dataset.csv'),
            encodingFormat: 'text/csv',
            contentUrl: `${siteUrl}${appRoutes.api.historyCsv()}`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        inLanguage: ldLanguage,
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

  return { breadcrumbs: localizedBreadcrumbs, faqItems, structuredData };
}

const MethodologyInputSchema = z.object({ locale: z.enum(LOCALES) });

export const getMethodologyPageData = createServerFn({ method: 'GET' })
  .validator(MethodologyInputSchema)
  .handler(async ({ data }) => {
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
    const { breadcrumbs, faqItems, structuredData } = buildMethodologyContent(
      data.locale,
      dataset,
      historyMeta,
      nowIso
    );

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
