import type { MetadataRoute } from 'next';
import { getRobotsBaseUrl, getRobotsSitemapUrl, isFallbackSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const host = getRobotsBaseUrl();
  const hasPublicHost = !isFallbackSiteUrl(host);

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: hasPublicHost ? getRobotsSitemapUrl() : undefined,
  };
}
