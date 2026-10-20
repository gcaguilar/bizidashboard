import { createFileRoute } from '@tanstack/react-router'
import { fetchAvailableDataMonths } from '@/lib/api'
import { formatMonthLabel } from '@/lib/months'
import { appRoutes } from '@/lib/routes'
import { getSiteUrl, SEO_SITE_DESCRIPTION, SEO_SITE_NAME } from '@/lib/site'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function monthPubDate(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthNumber - 1, 1, 6, 0, 0)).toUTCString()
}

export async function buildReportsFeed(): Promise<string> {
  const siteUrl = getSiteUrl()
  const response = await fetchAvailableDataMonths().catch(() => ({ months: [] as string[] }))
  const months = Array.from(new Set(response.months ?? []))
    .filter((month) => /^\d{4}-\d{2}$/.test(month))
    .sort((left, right) => right.localeCompare(left))
    .slice(0, 24)

  const items = months
    .map((month) => {
      const label = formatMonthLabel(month)
      const url = `${siteUrl}${appRoutes.reportMonth(month)}`
      return [
        '    <item>',
        `      <title>Informe ${escapeXml(label)} de Bizi Zaragoza</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${monthPubDate(month)}</pubDate>`,
        `      <description>${escapeXml(
          `Informe mensual de Bizi Zaragoza para ${label}: resumen ejecutivo, evolución, barrios y problemas recurrentes.`
        )}</description>`,
        '    </item>',
      ].join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(`${SEO_SITE_NAME} · Informes mensuales de Bizi Zaragoza`)}</title>`,
    `    <link>${escapeXml(`${siteUrl}${appRoutes.reports()}`)}</link>`,
    `    <description>${escapeXml(SEO_SITE_DESCRIPTION)}</description>`,
    '    <language>es-ES</language>',
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(`${siteUrl}${appRoutes.feed()}`)}" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}

export const Route = createFileRoute('/feed.xml')({
  server: {
    handlers: {
      GET: async () => {
        const body = await buildReportsFeed()
        return new Response(body, {
          status: 200,
          headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
          },
        })
      },
    },
  },
})
