import { createServerFn } from '@tanstack/react-start';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes';
import { getCityName } from '@/lib/site';
import { buildFallbackComparisonHubData, getComparisonHubDataWithTimeout } from '@/lib/comparison-hub';

export const getCompareHubLoaderData = createServerFn({ method: 'GET' }).handler(async () => {

  const cityName = getCityName();
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Comparar',
    href: appRoutes.compare(),
  });
  const comparisonData = await getComparisonHubDataWithTimeout().catch(() => buildFallbackComparisonHubData());

  return {
    breadcrumbs,
    comparisonData,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        buildBreadcrumbStructuredData(breadcrumbs),
        {
          '@type': 'CollectionPage',
          name: `Comparador ${cityName}`,
          description:
            'Comparativas activas entre estaciones, barrios, periodos y cambios del sistema.',
          url: toAbsoluteRouteUrl(appRoutes.compare()),
        },
      ],
    },
  };
});
