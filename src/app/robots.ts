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
    // Following the draft specification: https://datatracker.ietf.org/doc/draft-romm-aipref-contentsignals/
    // ai-train=no: Do not use content for training AI models
    // search=yes: Allow content to be indexed for search
    // ai-input=no: Do not use content as input for AI systems
    // Note: Next.js MetadataRoute.Robots doesn't have explicit contentSignals property,
    // so we need to add it as a custom property that will be serialized correctly
    // @ts-ignore - Adding custom property for Content Signals
    contentSignals: {
      'ai-train': 'no',
      'search': 'yes',
      'ai-input': 'no',
    },
  };
}
