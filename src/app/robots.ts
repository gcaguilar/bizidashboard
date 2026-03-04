import type { MetadataRoute } from 'next';
import { getRobotsBaseUrl, getRobotsSitemapUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const host = getRobotsBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: getRobotsSitemapUrl(),
    host,
  };
}
