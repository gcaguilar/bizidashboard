import { createFileRoute } from '@tanstack/react-router'
import { fetchCachedMonthlyDemandCurve } from '@/lib/analytics-series'
import { fetchAvailableDataMonths } from '@/lib/api'
import { isValidMonthKey, REPORT_MONTHS_WINDOW } from '@/lib/months'
import { appRoutes, INDEXABLE_PUBLIC_ROUTE_REGISTRY } from '@/lib/routes'
import { getDistrictSeoRows } from '@/lib/seo-districts'
import { getStationSeoRows } from '@/lib/seo-stations'
import { getRobotsBaseUrl } from '@/lib/site'
import { renderSitemapUrlEntry, SITEMAP_URLSET_OPEN, withEnglishAlternates } from '@/lib/i18n/sitemap'

type SitemapEntry = {
  href: string
  lastModified?: string
  changeFrequency: string
  priority: number
}

/** Un informe cerrado se sella al terminar el mes; el mes en curso usa "ahora". */
function reportLastModified(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const monthEnd = new Date(Date.UTC(year, monthNumber, 1))
  const now = new Date()

  return (monthEnd > now ? now : monthEnd).toISOString()
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

function buildStaticSitemapXml(): string {
  const siteUrl = getRobotsBaseUrl()
  const urls = withEnglishAlternates(
    INDEXABLE_PUBLIC_ROUTE_REGISTRY.map((entry) => ({
      href: entry.href,
      changeFrequency: entry.sitemap.changeFrequency,
      priority: entry.sitemap.priority,
    })),
  )
    .map((entry) => renderSitemapUrlEntry(entry, siteUrl))
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
${SITEMAP_URLSET_OPEN}
${urls}
</urlset>
`
}

async function buildSitemapXml(): Promise<string> {
  const siteUrl = getRobotsBaseUrl()
  const [monthsResponse, monthlySeries, districts, stations] = await Promise.all([
    fetchAvailableDataMonths().catch((error) => {
      console.error('[sitemap.xml] fetchAvailableDataMonths failed:', error)
      return { months: [] }
    }),
    fetchCachedMonthlyDemandCurve(REPORT_MONTHS_WINDOW).catch((error) => {
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

  const entries = dedupeEntries(withEnglishAlternates([
    ...INDEXABLE_PUBLIC_ROUTE_REGISTRY.map((entry) => ({
      href: entry.href,
      changeFrequency: entry.sitemap.changeFrequency,
      priority: entry.sitemap.priority,
    })),
    ...validMonths.map((month) => ({
      href: appRoutes.reportMonth(month),
      lastModified: reportLastModified(month),
      changeFrequency: 'monthly',
      priority: 0.74,
    })),
    ...districts
      .filter((district) => district.stationCount > 0 && district.topStations.length > 0)
      .map((district) => ({
        href: `/estadisticas/barrios/${district.slug}`,
        changeFrequency: 'daily',
        priority: 0.68,
      })),
    ...stations
      .filter((station) => station.indexability.includeInSitemap)
      .map((station) => ({
        href: `/estadisticas/estaciones/${station.station.id}`,
        ...(station.station.recordedAt ? { lastModified: station.station.recordedAt } : {}),
        changeFrequency: 'hourly',
        priority: 0.66,
      })),
  ]))

  const urls = entries
    .map((entry) => renderSitemapUrlEntry(entry, siteUrl))
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
${SITEMAP_URLSET_OPEN}
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
            buildStaticSitemapXml(),
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
