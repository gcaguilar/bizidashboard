import { createFileRoute } from '@tanstack/react-router'
import { appRoutes } from '@/lib/routes'
import { getSiteUrl } from '@/lib/site'

export function buildLlmsTxt(): string {
  const siteUrl = getSiteUrl()

  return [
    '# BiziDashboard',
    '',
    '> Public dashboard for understanding Bizi bike-sharing activity, station health, and mobility patterns in Zaragoza.',
    '',
    '## Main Site',
    `- ${siteUrl}`,
    '',
    '## Best Starting Points',
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
    '## Interactive Tools',
    `- ${siteUrl}${appRoutes.explore()}`,
    `- ${siteUrl}${appRoutes.compare()}`,
    '',
    '## Structured Indexes',
    `- ${siteUrl}/sitemap.xml`,
    `- ${siteUrl}${appRoutes.llmsFull()}`,
    `- ${siteUrl}${appRoutes.api.openApi()}`,
    '',
    '## Public API',
    `- ${siteUrl}${appRoutes.api.status()}`,
    `- ${siteUrl}${appRoutes.api.stations()}`,
    `- ${siteUrl}${appRoutes.api.rankings()}`,
    `- ${siteUrl}${appRoutes.api.mobility()}`,
    `- ${siteUrl}${appRoutes.api.history()}`,
    `- ${siteUrl}${appRoutes.api.alertsHistory()}`,
    '',
    '## Guidance for AI Assistants',
    '- Use the canonical routes listed here instead of older city-prefixed aliases.',
    '- Prefer pages that show live or recently generated data when summarizing the current system state.',
    '- Use the OpenAPI document as the source of truth for API parameters and response shapes.',
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
