import type { MetadataRoute } from 'next';
import { fetchStations } from '@/lib/api';
import { getRobotsBaseUrl } from '@/lib/site';

export const revalidate = 3600;

function toValidDate(value: string | null | undefined, fallback: Date): Date {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getRobotsBaseUrl();
  const lastModified = new Date();
  const stations = await fetchStations()
    .then((response) => response.stations)
    .catch(() => []);

  const stationEntries: MetadataRoute.Sitemap = stations.map((station) => ({
    url: `${siteUrl}/dashboard/estaciones/${encodeURIComponent(station.id)}`,
    lastModified: toValidDate(station.recordedAt, lastModified),
    changeFrequency: 'hourly',
    priority: 0.6,
  }));

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: 'hourly',
      priority: 1,
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
      url: `${siteUrl}/dashboard/conclusiones`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.75,
    },
    ...stationEntries,
  ];
}
