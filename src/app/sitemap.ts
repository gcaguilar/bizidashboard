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
      url: `${siteUrl}/dashboard/live`,
      lastModified,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
  ];
}
