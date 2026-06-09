import { createFileRoute } from '@tanstack/react-router'
import { getStationRankings, getStationsWithLatestStatus } from '@/analytics/queries/read'
import { fetchDistrictCollection } from '@/lib/districts.server'
import { buildDistrictSpotlight, enrichRankingRows, buildPeakFullHoursByStation, attachPeakFullHours } from '@/lib/ranking-enrichment'
import { buildStationDistrictMap } from '@/lib/districts'
import { getSharedDatasetSnapshot } from '@/services/shared-data'
import { resolveRankingsDataState } from '@/lib/data-state'
import { withPublicApiRoute } from '@/lib/security/public-api-route'

export const Route = createFileRoute('/api/rankings/')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: '/api/rankings',
          routeGroup: 'api.rankings',
          namespace: 'public-rankings',
          limit: 40,
          windowMs: 60_000,
          requireApiKey: false,
          cacheControl: 'public, max-age=300, stale-while-revalidate=300',
        },
        async ({ request, access }) => {
          const typeParam = new URL(request.url).searchParams.get('type') ?? 'turnover'
          if (typeParam !== 'turnover' && typeParam !== 'availability') {
            return new Response(JSON.stringify({ error: 'Invalid type. Use "turnover" or "availability".', dataState: 'error' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
          }
          const type = typeParam
          const limitParam = new URL(request.url).searchParams.get('limit') ?? '20'
          const parsedLimit = parseInt(limitParam)
          if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
            return new Response(JSON.stringify({ error: 'Invalid limit. Must be a positive integer.', dataState: 'error' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
          }
          const limit = Math.min(Math.max(1, parsedLimit), 200)
          const format = new URL(request.url).searchParams.get('format')

          const [rankings, stations, districtCollection, dataset] = await Promise.all([
            getStationRankings(type, limit).catch(() => []),
            getStationsWithLatestStatus().catch(() => []),
            fetchDistrictCollection().catch(() => null),
            getSharedDatasetSnapshot().catch(() => null),
          ])

          const stationNameById = new Map(stations.map((s) => [s.id, s.name]))
          const districtNameById =
            districtCollection !== null
              ? buildStationDistrictMap(stations.map((s) => ({ id: s.id, lon: s.lon, lat: s.lat })), districtCollection)
              : new Map<string, string>()

          let enriched = enrichRankingRows(rankings, stationNameById, districtNameById)
          const peakMap = buildPeakFullHoursByStation([])
          enriched = attachPeakFullHours(enriched, peakMap)
          const districtSpotlight = buildDistrictSpotlight(enriched, typeParam)

          const payload = {
            type: type,
            limit,
            rankings: enriched,
            districtSpotlight,
            generatedAt: new Date().toISOString(),
            dataState: resolveRankingsDataState({ count: enriched.length, coverage: dataset?.coverage }),
          }

          if (format === 'csv') {
            const escapeCsv = (v: string | number) => String(v).includes(',') || String(v).includes('"') ? `"${String(v).replace(/"/g, '""')}"` : String(v);
            const headers = ['stationId', 'turnoverScore', 'emptyHours', 'fullHours', 'totalHours']
            const rows = payload.rankings.map((r) => [r.stationId, r.turnoverScore, r.emptyHours, r.fullHours, r.totalHours])
            const csv = [headers, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n')
            return new Response(csv, {
              status: 200,
              headers: { 'Content-Type': 'text/csv; charset=utf-8', ...access.headers },
            })
          }

          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...access.headers },
          })
        }
      ),
    },
  },
})
