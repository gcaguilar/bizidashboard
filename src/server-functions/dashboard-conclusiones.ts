import { createServerFn } from '@tanstack/react-start';

function safeNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof value === 'bigint') return Number(value);
  return 0;
}

function safeString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}

function serializeConclusionsPayload(payload: unknown): MobilityConclusionsPayload {
  if (!payload || typeof payload !== 'object') {
    return buildFallbackPayload();
  }
  const p = payload as Record<string, unknown>;
  const metrics = (p.metrics as Record<string, unknown> | undefined) || {};
  const weekdayWeekendProfile = (p.weekdayWeekendProfile as Record<string, unknown> | undefined) || {};
  const weekday = (weekdayWeekendProfile.weekday as Record<string, unknown> | undefined) || {};
  const weekend = (weekdayWeekendProfile.weekend as Record<string, unknown> | undefined) || {};

  return {
    dateKey: safeString(p.dateKey),
    generatedAt: safeString(p.generatedAt),
    selectedMonth: p.selectedMonth ? safeString(p.selectedMonth) : null,
    sourceFirstDay: p.sourceFirstDay ? safeString(p.sourceFirstDay) : null,
    sourceLastDay: p.sourceLastDay ? safeString(p.sourceLastDay) : null,
    totalHistoricalDays: safeNumber(p.totalHistoricalDays),
    stationsWithData: safeNumber(p.stationsWithData),
    activeStations: safeNumber(p.activeStations),
    metrics: {
      demandLast7Days: safeNumber(metrics.demandLast7Days),
      demandPrevious7Days: safeNumber(metrics.demandPrevious7Days),
      demandDeltaRatio: p.metrics.demandDeltaRatio != null ? safeNumber(p.metrics.demandDeltaRatio) : null,
      occupancyLast7Days: safeNumber(metrics.occupancyLast7Days),
      occupancyPrevious7Days: safeNumber(metrics.occupancyPrevious7Days),
      occupancyDeltaRatio: p.metrics.occupancyDeltaRatio != null ? safeNumber(p.metrics.occupancyDeltaRatio) : null,
    },
    summary: safeString(p.summary),
    highlights: Array.isArray(p.highlights) ? p.highlights : [],
    recommendations: Array.isArray(p.recommendations) ? p.recommendations : [],
    peakDemandHours: Array.isArray(p.peakDemandHours) ? (p.peakDemandHours as Array<Record<string, unknown>>).map((h: Record<string, unknown>) => ({
      hour: safeNumber(h.hour),
      demandScore: safeNumber(h.demandScore),
    })) : [],
    topDistrictsByDemand: Array.isArray(p.topDistrictsByDemand) ? (p.topDistrictsByDemand as Array<Record<string, unknown>>).map((d: Record<string, unknown>) => ({
      district: safeString(d.district),
      demandScore: safeNumber(d.demandScore),
    })) : [],
    topStationsByDemand: Array.isArray(p.topStationsByDemand) ? (p.topStationsByDemand as Array<Record<string, unknown>>).map((s: Record<string, unknown>) => ({
      stationId: safeString(s.stationId),
      stationName: safeString(s.stationName),
      avgDemand: safeNumber(s.avgDemand),
    })) : [],
    leastUsedStations: Array.isArray(p.leastUsedStations) ? (p.leastUsedStations as Array<Record<string, unknown>>).map((s: Record<string, unknown>) => ({
      stationId: safeString(s.stationId),
      stationName: safeString(s.stationName),
      avgDemand: safeNumber(s.avgDemand),
    })) : [],
    weekdayWeekendProfile: {
      weekday: {
        avgDemand: safeNumber(weekday.avgDemand),
        avgOccupancy: safeNumber(weekday.avgOccupancy),
        daysCount: safeNumber(weekday.daysCount),
      },
      weekend: {
        avgDemand: safeNumber(weekend.avgDemand),
        avgOccupancy: safeNumber(weekend.avgOccupancy),
        daysCount: safeNumber(weekend.daysCount),
      },
      demandGapRatio: p.weekdayWeekendProfile.demandGapRatio != null ? safeNumber(p.weekdayWeekendProfile.demandGapRatio) : null,
      dominantPeriod: (p.weekdayWeekendProfile.dominantPeriod as 'weekday' | 'weekend' | null) ?? null,
    },
  };
}

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

    let conclusionsResult: { payload: unknown; fromCache: boolean } = { payload: fallbackPayload, fromCache: false };
    try {
      conclusionsResult = await getDailyMobilityConclusions(activeMonth);
    } catch {
      conclusionsResult = { payload: fallbackPayload, fromCache: false };
    }
    const payload = serializeConclusionsPayload(conclusionsResult.payload);
    const fromCache = conclusionsResult.fromCache;
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
