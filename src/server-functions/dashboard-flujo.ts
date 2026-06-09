import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { normalizeMonthSearchParam, resolveActiveMonth } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { getSiteUrl, SITE_NAME } from '@/lib/site';
import { fetchAvailableDataMonths, fetchStations } from '@/lib/api';

const FlowSearchParamsSchema = z.object({
  month: z.union([z.string(), z.array(z.string())]).optional(),
}).default({});

type FlowSearchParams = z.infer<typeof FlowSearchParamsSchema>;

export const getDashboardFlowPageData = createServerFn({ method: 'GET' })
  .validator(FlowSearchParamsSchema)
  .handler(async ({ data: searchParams }: { data: FlowSearchParams | undefined }) => {

    const siteUrl = getSiteUrl();

    const [stations, availableMonths] = await Promise.all([
      fetchStations().catch(() => ({
        stations: [],
        generatedAt: new Date().toISOString(),
      })),
      fetchAvailableDataMonths().catch(() => ({ months: [], generatedAt: new Date().toISOString() })),
    ]);

    const activeMonth = resolveActiveMonth(
      availableMonths.months,
      normalizeMonthSearchParam(searchParams?.month)
    );

    const selectedStationId = stations.stations[0]?.id ?? '';
    const breadcrumbs = createRootBreadcrumbs(
      {
        label: 'Dashboard',
        href: appRoutes.dashboard(),
      },
      {
        label: 'Flujo',
        href: appRoutes.dashboardFlow(),
      }
    );
    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        buildBreadcrumbStructuredData(breadcrumbs),
        {
          '@type': 'Dataset',
          name: 'Corredores y flujo por barrios de Bizi Zaragoza',
          description:
            'Datos agregados de movilidad, demanda, impacto del transporte publico y flujos entre barrios para el analisis urbano.',
          url: `${siteUrl}${appRoutes.dashboardFlow()}`,
          creator: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: siteUrl,
          },
          distribution: [
            { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${siteUrl}${appRoutes.api.mobility()}` },
            { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${siteUrl}${appRoutes.api.history()}` },
          ],
        },
      ],
    };

    return {
      stations,
      availableMonths,
      activeMonth,
      selectedStationId,
      breadcrumbs,
      structuredData,
    };
  });
