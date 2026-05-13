import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { normalizeMonthSearchParam, resolveActiveMonth } from '@/lib/months';
import type { MobilityConclusionsPayload } from '@/lib/mobility-conclusions';
import { appRoutes } from '@/lib/routes';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

const ConclusionsSearchParamsSchema = z.object({
  month: z.union([z.string(), z.array(z.string())]).optional(),
}).default({});

type ConclusionsSearchParams = z.infer<typeof ConclusionsSearchParamsSchema>;

function buildFallbackPayload(): MobilityConclusionsPayload {
  const now = new Date().toISOString().slice(0, 10);

  return {
    dateKey: now,
    generatedAt: new Date().toISOString(),
    selectedMonth: null,
    sourceFirstDay: null,
    sourceLastDay: null,
    totalHistoricalDays: 0,
    stationsWithData: 0,
    activeStations: 0,
    metrics: {
      demandLast7Days: 0,
      demandPrevious7Days: 0,
      demandDeltaRatio: null,
      occupancyLast7Days: 0,
      occupancyPrevious7Days: 0,
      occupancyDeltaRatio: null,
    },
    summary: 'Todavia no hay historico suficiente para generar conclusiones de movilidad.',
    highlights: [],
    recommendations: ['Recoge al menos varios dias de datos para habilitar recomendaciones operativas.'],
    peakDemandHours: [],
    topDistrictsByDemand: [],
    topStationsByDemand: [],
    leastUsedStations: [],
    weekdayWeekendProfile: {
      weekday: { avgDemand: 0, avgOccupancy: 0, daysCount: 0 },
      weekend: { avgDemand: 0, avgOccupancy: 0, daysCount: 0 },
      demandGapRatio: null,
      dominantPeriod: null,
    },
  };
}

export const getDashboardConclusionsPageData = createServerFn({ method: 'GET' })
  .inputValidator(ConclusionsSearchParamsSchema)
  .handler(async ({ data: searchParams }: { data: ConclusionsSearchParams | undefined }) => {
    const [{ fetchAvailableDataMonths }, { getDailyMobilityConclusions }] = await Promise.all([
      import('@/lib/api'),
      import('@/lib/mobility-conclusions'),
    ]);
    const siteUrl = getSiteUrl();
    const fallbackPayload = buildFallbackPayload();
    const availableMonths = await fetchAvailableDataMonths().catch(() => ({
      months: [],
      generatedAt: new Date().toISOString(),
    }));
    const activeMonth = resolveActiveMonth(
      availableMonths.months,
      normalizeMonthSearchParam(searchParams?.month)
    );

    const { payload, fromCache } = await getDailyMobilityConclusions(activeMonth).catch(() => ({
      payload: fallbackPayload,
      fromCache: false,
    }));
    const breadcrumbs = createRootBreadcrumbs(
      {
        label: 'Dashboard',
        href: appRoutes.dashboard(),
      },
      {
        label: 'Conclusiones',
        href: appRoutes.dashboardConclusions(),
      }
    );

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        buildBreadcrumbStructuredData(breadcrumbs),
        {
          '@type': 'Report',
          name: 'Conclusiones de movilidad en Zaragoza',
          description: payload.summary,
          datePublished: payload.generatedAt,
          dateModified: payload.generatedAt,
          inLanguage: 'es',
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: siteUrl,
          },
          about: {
            '@type': 'Dataset',
            name: 'Movilidad urbana de Bizi Zaragoza',
            distribution: [
              { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${siteUrl}${appRoutes.api.history()}` },
            ],
          },
        },
      ],
    };

    return {
      payload,
      fromCache,
      availableMonths,
      activeMonth,
      breadcrumbs,
      structuredData,
    };
  });
