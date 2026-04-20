import { getRobotsBaseUrl, getRobotsSitemapUrl, isFallbackSiteUrl } from '@/lib/site';

const CONTENT_SIGNAL_VALUE = 'ai-train=no, search=yes, ai-input=no';

export function buildRobotsTxt(): string {
  const host = getRobotsBaseUrl();
  const hasPublicHost = !isFallbackSiteUrl(host);
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    `Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
    '',
    'User-agent: GPTBot',
    'Allow: /',
    'Disallow: /api/',
    `Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    'Disallow: /api/',
    `Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    'Disallow: /api/',
    `Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    'Disallow: /api/',
    `Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
  ];

  if (hasPublicHost) {
    lines.push('', `Host: ${host}`, `Sitemap: ${getRobotsSitemapUrl()}`);
  }

  return `${lines.join('\n')}\n`;
}

export { CONTENT_SIGNAL_VALUE };
