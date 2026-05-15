import { createFileRoute } from '@tanstack/react-router'
import { appRoutes } from '@/lib/routes'
import { getSiteUrl } from '@/lib/site'

function buildLlmsTxt(): string {
  const siteUrl = getSiteUrl()

  return [
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
    `- ${siteUrl}${appRoutes.seoPage('uso-bizi-por-estacion')}`,
    `- ${siteUrl}${appRoutes.districtLanding()}`,
    `- ${siteUrl}${appRoutes.reports()}`,
    `- ${siteUrl}${appRoutes.status()}`,
    `- ${siteUrl}${appRoutes.developers()}`,
    `- ${siteUrl}${appRoutes.methodology()}`,
    `- ${siteUrl}${appRoutes.utilityLanding()}`,
    `- ${siteUrl}${appRoutes.insightsLanding()}`,
    '',
    '## Public Tool Surfaces',
    `- ${siteUrl}${appRoutes.explore()}`,
    `- ${siteUrl}${appRoutes.compare()}`,
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
  ].join('\n')
}

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(buildLlmsTxt(), {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        }),
    },
  },
})
