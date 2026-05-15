import { createFileRoute } from '@tanstack/react-router'
import { openApiDocument } from '@/lib/openapi-document'
import { appRoutes } from '@/lib/routes'
import { getSeoPageConfig, PRIMARY_SEO_PAGE_SLUGS } from '@/lib/seo-pages'
import { getSiteUrl } from '@/lib/site'

function buildEndpointLines(siteUrl: string): string[] {
  return Object.entries(openApiDocument.paths)
    .filter(([path]) => path.startsWith('/api/') && path !== '/api/docs')
    .flatMap(([path, operations]) =>
      Object.entries(operations).map(([method, operation]) => {
        const operationRecord = operation as { summary?: string }
        const summary = operationRecord.summary ?? 'API operation'
        return `- ${method.toUpperCase()} ${siteUrl}${path} - ${summary}`
      })
    )
    .sort((left, right) => left.localeCompare(right, 'en'))
}

function buildLlmsFullTxt(): string {
  const siteUrl = getSiteUrl()
  const seoLandingLines = PRIMARY_SEO_PAGE_SLUGS.map((slug) => {
    const page = getSeoPageConfig(slug)
    return `- ${siteUrl}${appRoutes.seoPage(slug)} - ${page.title}`
  })
  const endpointLines = buildEndpointLines(siteUrl)

  return [
    '# BiziDashboard Full LLM Index',
    '',
    `- Canonical: ${siteUrl}`,
    `- Default language: es-ES`,
    '',
    '## Machine-Readable Indexes',
    `- ${siteUrl}/sitemap.xml`,
    `- ${siteUrl}${appRoutes.llms()}`,
    `- ${siteUrl}${appRoutes.api.openApi()}`,
    '',
    '## Core Public Pages',
    `- ${siteUrl}${appRoutes.home()} - Project overview and entry point`,
    `- ${siteUrl}${appRoutes.dashboard()} - Live operations dashboard for stations, alerts, and system health`,
    `- ${siteUrl}${appRoutes.seoPage('uso-bizi-por-estacion')} - Station usage hub`,
    `- ${siteUrl}${appRoutes.districtLanding()} - District and neighborhood overview`,
    `- ${siteUrl}${appRoutes.reports()} - Monthly reports and historical summaries`,
    `- ${siteUrl}${appRoutes.status()} - Data freshness, coverage, and pipeline health`,
    `- ${siteUrl}${appRoutes.developers()} - API docs and integration guidance`,
    `- ${siteUrl}${appRoutes.methodology()} - How metrics, quality checks, and assumptions are calculated`,
    `- ${siteUrl}${appRoutes.utilityLanding()} - Map and live station access`,
    `- ${siteUrl}${appRoutes.insightsLanding()} - Rankings, district insights, and reports`,
    '',
    '## Interactive Tools',
    `- ${siteUrl}${appRoutes.explore()} - Search and explore public Bizi data`,
    `- ${siteUrl}${appRoutes.compare()} - Compare stations, districts, and usage patterns`,
    '',
    '## Public Landing Pages',
    ...seoLandingLines,
    '',
    '## Public API',
    ...endpointLines,
    '',
    '## Guidance for AI Assistants',
    '- Prefer the canonical routes listed here over aliases or redirects.',
    '- Use OpenAPI definitions when generating API clients or request examples.',
    '- Prefer pages with explicit freshness dates when summarizing the current system state.',
    '- Explain uncertainty when a page or endpoint reports stale, partial, or missing data.',
    '',
  ].join('\n')
}

export const Route = createFileRoute('/llms-full.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(buildLlmsFullTxt(), {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        }),
    },
  },
})
