import type { MetadataRoute } from 'next';
import { DASHBOARD_VIEW_MODES } from '@/lib/dashboard-modes';
import { isValidMonthKey } from '@/lib/months';
import { getDistrictSeoRows } from '@/lib/seo-districts';
import { SEO_PAGE_SLUGS } from '@/lib/seo-pages';
import { getRobotsBaseUrl, isFallbackSiteUrl } from '@/lib/site';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

function toValidDate(value: string | null | undefined, fallback: Date): Date {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getRobotsBaseUrl();
  if (isFallbackSiteUrl(siteUrl)) {
    return [];
  }

  const lastModified = new Date();
  const stations = await import('@/lib/api')
    .then(({ fetchStations }) => fetchStations())
    .then((response) => response.stations)
    .catch(() => []);
  const months = await import('@/lib/api')
    .then(({ fetchAvailableDataMonths }) => fetchAvailableDataMonths())
    .then((response) => response.months)
    .catch(() => []);
  const validMonths = Array.from(new Set(months.filter(isValidMonthKey))).sort((left, right) =>
    right.localeCompare(left, 'es')
  );
  const districtRows = await getDistrictSeoRows().catch(() => []);

  const stationEntries: MetadataRoute.Sitemap = stations.map((station) => ({
    url: `${siteUrl}/dashboard/estaciones/${encodeURIComponent(station.id)}`,
    lastModified: toValidDate(station.recordedAt, lastModified),
    changeFrequency: 'hourly',
    priority: 0.6,
  }));

  const modeEntries: MetadataRoute.Sitemap = DASHBOARD_VIEW_MODES.map((mode) => ({
    url: `${siteUrl}/dashboard/views/${mode}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.55,
  }));

  const seoEntries: MetadataRoute.Sitemap = SEO_PAGE_SLUGS.map((slug) => ({
    url: `${siteUrl}/${slug}`,
    lastModified,
    changeFrequency: slug === 'estaciones-con-mas-bicis' ? 'hourly' : 'daily',
    priority: slug === 'informes-mensuales-bizi-zaragoza' ? 0.78 : 0.72,
  }));

  const reportEntries: MetadataRoute.Sitemap = validMonths.map((month) => ({
    url: `${siteUrl}/informes/${month}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.74,
  }));

  const districtEntries: MetadataRoute.Sitemap = districtRows.map((district) => ({
    url: `${siteUrl}/barrios/${district.slug}`,
    lastModified,
    changeFrequency: 'daily',
    priority: 0.68,
  }));

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${siteUrl}/informes`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.82,
    },
    {
      url: `${siteUrl}/dashboard`,
      lastModified,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/dashboard/flujo`,
      lastModified,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/dashboard/alertas`,
      lastModified,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/dashboard/estaciones`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/dashboard/ayuda`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/dashboard/status`,
      lastModified,
      changeFrequency: 'hourly',
      priority: 0.65,
    },
    {
      url: `${siteUrl}/dashboard/conclusiones`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.75,
    },
    ...modeEntries,
    ...stationEntries,
    ...seoEntries,
    ...reportEntries,
    ...districtEntries,
  ];
}
