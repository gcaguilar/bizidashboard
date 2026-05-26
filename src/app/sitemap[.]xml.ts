import { createFileRoute } from '@tanstack/react-router'
import { fetchCachedMonthlyDemandCurve } from '@/lib/analytics-series'
import { fetchAvailableDataMonths } from '@/lib/api'
import { isValidMonthKey } from '@/lib/months'
import { appRoutes, INDEXABLE_PUBLIC_ROUTE_REGISTRY } from '@/lib/routes'
import { getDistrictSeoRows } from '@/lib/seo-districts'
import { getStationSeoRows } from '@/lib/seo-stations'
import { getRobotsBaseUrl } from '@/lib/site'

type SitemapEntry = {
  href: string
  lastModified: string
  changeFrequency: string
  priority: number
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function dedupeEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>()
  const uniqueEntries: SitemapEntry[] = []

  for (const entry of entries) {
    if (seen.has(entry.href)) {
      continue
    }

    seen.add(entry.href)
    uniqueEntries.push(entry)
  }

  return uniqueEntries
}

async function buildSitemapXml(): Promise<string> {
  const siteUrl = getRobotsBaseUrl()
  const lastModified = new Date().toISOString()
  const [monthsResponse, monthlySeries, districts, stations] = await Promise.all([
    fetchAvailableDataMonths().catch((error) => {
      console.error('[sitemap.xml] fetchAvailableDataMonths failed:', error)
      return { months: [] }
    }),
    fetchCachedMonthlyDemandCurve(36).catch((error) => {
      console.error('[sitemap.xml] fetchCachedMonthlyDemandCurve failed:', error)
      return []
    }),
    getDistrictSeoRows().catch((error) => {
      console.error('[sitemap.xml] getDistrictSeoRows failed:', error)
      return []
    }),
    getStationSeoRows().catch((error) => {
      console.error('[sitemap.xml] getStationSeoRows failed:', error)
      return []
    }),
  ])
  const validMonths = Array.from(
    new Set(
      [
        ...(monthsResponse.months ?? []),
        ...monthlySeries.map((row) => row.monthKey),
      ].filter(isValidMonthKey)
    )
  ).sort((left, right) => right.localeCompare(left, 'es'))

  const entries = dedupeEntries([
    ...INDEXABLE_PUBLIC_ROUTE_REGISTRY.map((entry) => ({
      href: entry.href,
      lastModified,
      changeFrequency: entry.sitemap.changeFrequency,
      priority: entry.sitemap.priority,
    })),
    { href: appRoutes.llms(), lastModified, changeFrequency: 'daily', priority: 0.6 },
    { href: appRoutes.llmsFull(), lastModified, changeFrequency: 'daily', priority: 0.58 },
    ...validMonths.map((month) => ({
      href: appRoutes.reportMonth(month),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.74,
    })),
    ...districts
      .filter((district) => district.stationCount > 0 && district.topStations.length > 0)
      .map((district) => ({
        href: `/estadisticas/barrios/${district.slug}`,
        lastModified,
        changeFrequency: 'daily',
        priority: 0.68,
      })),
    ...stations
      .filter((station) => station.indexability.includeInSitemap)
      .map((station) => ({
        href: `/estadisticas/estaciones/${station.station.id}`,
        lastModified: station.station.recordedAt ?? lastModified,
        changeFrequency: 'hourly',
        priority: 0.66,
      })),
  ])

  const urls = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(`${siteUrl}${entry.href}`)}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const xml = await buildSitemapXml()
          return new Response(xml, {
            status: 200,
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
              'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
            },
          })
        } catch (error) {
          console.error('[sitemap.xml] Error building sitemap:', error)
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n`,
            {
              status: 200,
              headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=300',
              },
            }
          )
        }
      },
    },
  },
})
