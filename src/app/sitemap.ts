import type { MetadataRoute } from 'next';
import { getRobotsBaseUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getRobotsBaseUrl();
  const lastModified = new Date();

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
  ];
}
