import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { searchGlobalContent } from '@/lib/global-search';
import { isValidMonthKey } from '@/lib/months';
import { getExploreHubSections } from '@/lib/public-navigation';
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes';
import { getCityName } from '@/lib/site';
import { fetchAvailableDataMonths } from '@/lib/api';
import { buildFallbackAvailableMonths } from '@/lib/shared-data-fallbacks';

const ExploreSearchParamsSchema = z.object({
  q: z.string().optional(),
});

export const getExploreLoaderData = createServerFn({ method: 'GET' })
  .validator(ExploreSearchParamsSchema)
  .handler(async ({ data: { q } }) => {

  const nowIso = new Date().toISOString();
  const cityName = getCityName();
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Explorar',
    href: appRoutes.explore(),
  });

  const availableMonths = await fetchAvailableDataMonths().catch(() =>
    buildFallbackAvailableMonths(nowIso)
  );

  const latestMonth = availableMonths.months.filter(isValidMonthKey)[0] ?? null;
  const sections = getExploreHubSections({ latestMonth });
  const totalTools = sections.reduce((count, section) => count + section.items.length, 0);
  const itemList = sections.flatMap((section) => section.items);

  const trimmedQuery = q?.trim() ?? '';
  const searchResults = trimmedQuery
    ? await searchGlobalContent(trimmedQuery).catch(() => null)
    : null;

  return {
    searchQuery: trimmedQuery,
    searchResults,
    latestMonth,
    sections,
    totalTools,
    breadcrumbs,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        buildBreadcrumbStructuredData(breadcrumbs),
        {
          '@type': 'CollectionPage',
          name: `Hub Explorar ${cityName}`,
          description:
            'Indice publico de herramientas de analisis, comparativa, mapas, historico y movilidad.',
          url: toAbsoluteRouteUrl(appRoutes.explore()),
          hasPart: itemList.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.title,
            url: toAbsoluteRouteUrl(item.href),
          })),
        },
      ],
    },
  };
});
