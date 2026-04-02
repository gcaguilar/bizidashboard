import { openApiDocument } from '@/lib/openapi-document';
import { appRoutes } from '@/lib/routes';
import { getSeoPageConfig, PRIMARY_SEO_PAGE_SLUGS } from '@/lib/seo-pages';
import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-static';
export const revalidate = 86400;

function buildEndpointLines(siteUrl: string): string[] {
  return Object.entries(openApiDocument.paths)
    .filter(([path]) => path.startsWith('/api/') && path !== '/api/docs')
    .flatMap(([path, operations]) =>
      Object.entries(operations).map(([method, operation]) => {
        const operationRecord = operation as { summary?: string };
        const summary = operationRecord.summary ?? 'API operation';
        return `- ${method.toUpperCase()} ${siteUrl}${path} — ${summary}`;
      })
    )
    .sort((left, right) => left.localeCompare(right, 'en'));
}

export function GET() {
  const siteUrl = getSiteUrl();
  const seoLandingLines = PRIMARY_SEO_PAGE_SLUGS.map((slug) => {
    const page = getSeoPageConfig(slug);
    return `- ${siteUrl}${appRoutes.seoPage(slug)} — ${page.title}`;
  });
  const endpointLines = buildEndpointLines(siteUrl);

  const body = [
    '# BiziDashboard LLM Full Index',
    '',
    `- Canonical: ${siteUrl}`,
    `- Default language: es-ES`,
    '',
    '## Machine-readable discovery',
    `- ${siteUrl}/sitemap.xml`,
    `- ${siteUrl}${appRoutes.llms()}`,
    `- ${siteUrl}${appRoutes.api.openApi()}`,
    '',
    '## Core public pages',
    `- ${siteUrl}${appRoutes.home()} — Homepage`,
    `- ${siteUrl}${appRoutes.dashboard()} — Real-time operations dashboard`,
    `- ${siteUrl}${appRoutes.explore()} — Public explore hub`,
    `- ${siteUrl}${appRoutes.compare()} — Comparative analytics`,
    `- ${siteUrl}${appRoutes.reports()} — Monthly reports`,
    `- ${siteUrl}${appRoutes.status()} — Data freshness and health`,
    `- ${siteUrl}${appRoutes.developers()} — API and integration docs`,
    '',
    '## SEO landing pages',
    ...seoLandingLines,
    '',
    '## Public API surface',
    ...endpointLines,
    '',
    '## Agent instructions',
    '- Always prefer canonical routes.',
    '- Avoid aliases that are expected to redirect.',
    '- Use OpenAPI definitions when generating API clients or requests.',
    '- Prefer pages with explicit freshness dates when summarizing current state.',
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
