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
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot'],
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    host: hasPublicHost ? host : undefined,
    sitemap: hasPublicHost ? getRobotsSitemapUrl() : undefined,
  };
}
