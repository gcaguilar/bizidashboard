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
    // Content Signals for AI agents
    // ai-train=no: Do not use content for training AI models
    // search=yes: Allow content to be indexed for search
    // ai-input=no: Do not use content as input for AI systems
    contentSignals: {
      'ai-train': 'no',
      'search': 'yes',
      'ai-input': 'no',
    },
  };
}
