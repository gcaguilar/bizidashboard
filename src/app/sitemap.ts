import type { MetadataRoute } from 'next';
import { getSeoLandingPageData } from '@/app/_seo/SeoLandingPage';
import {
  getInsightsLandingData,
  getUtilityLandingData,
} from '@/lib/acquisition-landings';
import { fetchSharedDatasetSnapshot, fetchStatus } from '@/lib/api';
import { resolveDataState } from '@/lib/data-state';
import { isValidMonthKey } from '@/lib/months';
import { appRoutes, STATIC_PUBLIC_ROUTE_REGISTRY } from '@/lib/routes';
import { evaluatePageIndexability } from '@/lib/seo-policy';
import { getDistrictSeoRows } from '@/lib/seo-districts';
import { PRIMARY_SEO_PAGE_SLUGS } from '@/lib/seo-pages';
import { getStationSeoRows } from '@/lib/seo-stations';
import { getRobotsBaseUrl, isFallbackSiteUrl } from '@/lib/site';
import { getDailyMobilityConclusions } from '@/lib/mobility-conclusions';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

function toValidDate(value: string | null | undefined, fallback: Date): Date {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function dedupeSitemapEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  const uniqueEntries: MetadataRoute.Sitemap = [];

  for (const entry of entries) {
    if (seen.has(entry.url)) {
      continue;
    }

    seen.add(entry.url);
    uniqueEntries.push(entry);
  }

  return uniqueEntries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getRobotsBaseUrl();
  if (isFallbackSiteUrl(siteUrl)) {
    return [];
  }

  const lastModified = new Date();
  const months = await import('@/lib/api')
    .then(({ fetchAvailableDataMonths }) => fetchAvailableDataMonths())
    .then((response) => response.months)
    .catch(() => []);
  const validMonths = Array.from(new Set(months.filter(isValidMonthKey))).sort((left, right) =>
    right.localeCompare(left, 'es')
  );
  const [dataset, status, districtRows, stationRows, seoLandingData, utilityLanding, insightsLanding, reportIndexability] = await Promise.all([
    fetchSharedDatasetSnapshot().catch(() => null),
    fetchStatus().catch(() => null),
    getDistrictSeoRows().catch(() => []),
    getStationSeoRows().catch(() => []),
    Promise.all(PRIMARY_SEO_PAGE_SLUGS.map((slug) => getSeoLandingPageData(slug).catch(() => null))),
    getUtilityLandingData().catch(() => null),
    getInsightsLandingData().catch(() => null),
    Promise.resolve(
      evaluatePageIndexability({
        path: appRoutes.reports(),
        pageType: 'report',
        hasMeaningfulContent: true,
        hasData: validMonths.length > 0,
        requiresStrongCoverage: true,
        thresholds: [
          {
            label: 'published-months',
            current: validMonths.length,
            minimum: 1,
          },
        ],
      })
    ),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PUBLIC_ROUTE_REGISTRY.filter((entry) => {
    if (entry.href === appRoutes.reports()) {
      return reportIndexability.includeInSitemap;
    }

    if (entry.href === appRoutes.status()) {
      return evaluatePageIndexability({
        path: entry.href,
        pageType: 'data_hub',
        dataState:
          status && dataset
            ? resolveDataState({
                hasCoverage:
                  dataset.coverage.totalDays > 0 ||
                  Boolean(dataset.lastUpdated.lastSampleAt),
                hasData:
                  dataset.coverage.totalDays > 0 ||
                  status.quality.volume.recentStationCount > 0,
              })
            : 'empty',
        hasMeaningfulContent: true,
        hasData:
          Boolean(dataset?.lastUpdated.lastSampleAt) ||
          Number(dataset?.coverage.totalDays ?? 0) > 0,
      }).includeInSitemap;
    }

    if (entry.href === appRoutes.utilityLanding()) {
      return utilityLanding?.indexability.includeInSitemap ?? false;
    }

    if (entry.href === appRoutes.insightsLanding()) {
      return insightsLanding?.indexability.includeInSitemap ?? false;
    }

    return evaluatePageIndexability({
      path: entry.href,
    }).includeInSitemap;
  }).map((entry) => ({
    url: `${siteUrl}${entry.href}`,
    lastModified,
    changeFrequency: entry.sitemap.changeFrequency,
    priority: entry.sitemap.priority,
  }));

  const seoEntries: MetadataRoute.Sitemap = seoLandingData
    .filter((entry): entry is NonNullable<(typeof seoLandingData)[number]> => Boolean(entry))
    .filter((entry) => entry.indexability.includeInSitemap)
    .map((entry) => ({
      url: `${siteUrl}${entry.indexability.canonicalPath}`,
      lastModified: toValidDate(entry.content.generatedAt, lastModified),
      changeFrequency:
        entry.config.slug === 'estaciones-con-mas-bicis' ? 'hourly' : 'daily',
      priority: 0.72,
    }));

  const reportEntries = await Promise.all(
    validMonths.map(async (month) => {
      const payload = await getDailyMobilityConclusions(month)
        .then((result) => result.payload)
        .catch(() => null);

      const decision = evaluatePageIndexability({
        path: appRoutes.reportMonth(month),
        pageType: 'report',
        dataState: resolveDataState({
          hasCoverage:
            Boolean(payload?.sourceFirstDay) ||
            Boolean(payload?.sourceLastDay) ||
            Number(payload?.totalHistoricalDays ?? 0) > 0,
          hasData:
            Number(payload?.activeStations ?? 0) > 0 ||
            Number(payload?.topStationsByDemand.length ?? 0) > 0 ||
            Number(payload?.highlights.length ?? 0) > 0,
          isPartial:
            Number(payload?.totalHistoricalDays ?? 0) > 0 &&
            Number(payload?.totalHistoricalDays ?? 0) < 21,
        }),
        hasMeaningfulContent: true,
        hasData:
          Number(payload?.activeStations ?? 0) > 0 ||
          Number(payload?.topStationsByDemand.length ?? 0) > 0 ||
          Number(payload?.highlights.length ?? 0) > 0,
        requiresStrongCoverage: true,
        thresholds: [
          {
            label: 'active-stations',
            current: Number(payload?.activeStations ?? 0),
            minimum: 5,
          },
          {
            label: 'report-insights',
            current:
              Number(payload?.highlights.length ?? 0) +
              Number(payload?.topStationsByDemand.length ?? 0) +
              Number(payload?.topDistrictsByDemand.length ?? 0),
            minimum: 3,
          },
        ],
      });

      if (!decision.includeInSitemap) {
        return null;
      }

      return {
        url: `${siteUrl}${decision.canonicalPath}`,
        lastModified: toValidDate(payload?.generatedAt, lastModified),
        changeFrequency: 'monthly' as const,
        priority: 0.74,
      };
    })
  );

  const districtEntries: MetadataRoute.Sitemap = districtRows
    .filter((district) =>
      evaluatePageIndexability({
        path: appRoutes.districtDetail(district.slug),
        pageType: 'district',
        hasMeaningfulContent: true,
        hasData: district.stationCount > 0 && district.topStations.length > 0,
        requiresStrongCoverage: true,
        thresholds: [
          {
            label: 'district-stations',
            current: district.stationCount,
            minimum: 2,
          },
          {
            label: 'district-top-stations',
            current: district.topStations.length,
            minimum: 2,
          },
        ],
      }).includeInSitemap
    )
    .map((district) => ({
      url: `${siteUrl}${appRoutes.districtDetail(district.slug)}`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.68,
    }));

  const stationEntries: MetadataRoute.Sitemap = stationRows
    .filter((station) => station.indexability.includeInSitemap)
    .map((station) => ({
      url: `${siteUrl}${station.indexability.canonicalPath}`,
      lastModified: toValidDate(station.station.recordedAt, lastModified),
      changeFrequency: 'hourly' as const,
      priority: 0.66,
    }));

  return dedupeSitemapEntries([
    ...staticEntries,
    ...seoEntries,
    ...reportEntries.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    ...districtEntries,
    ...stationEntries,
  ]);
}
