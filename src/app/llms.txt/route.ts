import { appRoutes } from '@/lib/routes';
import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-static';
export const revalidate = 86400;

export function GET() {
  const siteUrl = getSiteUrl();

  const body = [
    '# BiziDashboard',
    '',
    '> Public analytics dashboard for Bizi bike-sharing operations in Zaragoza.',
    '',
    '## Canonical Site',
    `- ${siteUrl}`,
    '',
    '## Primary Public Pages',
    `- ${siteUrl}${appRoutes.home()}`,
    `- ${siteUrl}${appRoutes.dashboard()}`,
    `- ${siteUrl}${appRoutes.explore()}`,
    `- ${siteUrl}${appRoutes.reports()}`,
    `- ${siteUrl}${appRoutes.status()}`,
    `- ${siteUrl}${appRoutes.developers()}`,
    '',
    '## Structured Discovery',
    `- ${siteUrl}/sitemap.xml`,
    `- ${siteUrl}${appRoutes.llmsFull()}`,
    `- ${siteUrl}${appRoutes.api.openApi()}`,
    '',
    '## Public API Endpoints',
    `- ${siteUrl}${appRoutes.api.status()}`,
    `- ${siteUrl}${appRoutes.api.stations()}`,
    `- ${siteUrl}${appRoutes.api.rankings()}`,
    `- ${siteUrl}${appRoutes.api.mobility()}`,
    `- ${siteUrl}${appRoutes.api.history()}`,
    `- ${siteUrl}${appRoutes.api.alertsHistory()}`,
    '',
    '## Notes for AI Assistants',
    '- Prioritize canonical routes without city-prefixed aliases.',
    '- Prefer data-backed pages over deprecated aliases or redirects.',
    '- For API usage, rely on OpenAPI as source of truth.',
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
