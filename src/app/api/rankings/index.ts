import { createFileRoute } from '@tanstack/react-router'
import { getStationRankings } from '@/analytics/queries/read'
import { fetchCachedStationsWithLatestStatus } from '@/lib/analytics-series'
import { fetchDistrictCollection } from '@/lib/districts.server'
import { buildDistrictSpotlight, enrichRankingRows, type EnrichedRankingRow } from '@/lib/ranking-enrichment'
import { buildStationDistrictMap } from '@/lib/districts'
import { getSharedDatasetSnapshot } from '@/services/shared-data'
import type { CoverageSummary } from '@/services/shared-data/types'
import { resolveRankingsDataState } from '@/lib/data-state'
import { csvResponse } from '@/lib/csv'
import { withCache } from '@/lib/cache/cache'
import { withPublicApiRoute } from '@/lib/security/public-api-route'

/**
 * Se cachea el lote completo (límite máximo que la ruta acepta) y se recorta
 * al límite pedido, igual que `/api/history` recorta con `days`: ventanas
 * distintas comparten cache.
 */
const RANKINGS_BASE_LIMIT = 200
const RANKINGS_CACHE_TTL_SECONDS = 300

type CachedRankingsPayload = {
  rankings: EnrichedRankingRow[]
  generatedAt: string
  coverage: CoverageSummary | null
}

async function buildRankingsBase(type: 'turnover' | 'availability'): Promise<CachedRankingsPayload> {
  const [rankings, stations, districtCollection, dataset] = await Promise.all([
    getStationRankings(type, RANKINGS_BASE_LIMIT).catch(() => []),
    fetchCachedStationsWithLatestStatus().catch(() => []),
    fetchDistrictCollection().catch(() => null),
    getSharedDatasetSnapshot().catch(() => null),
  ])

  const stationNameById = new Map(stations.map((s) => [s.id, s.name]))
  const districtNameById =
    districtCollection !== null
      ? buildStationDistrictMap(stations.map((s) => ({ id: s.id, lon: s.lon, lat: s.lat })), districtCollection)
      : new Map<string, string>()

  const enriched = enrichRankingRows(rankings, stationNameById, districtNameById)

  return {
    rankings: enriched,
    generatedAt: new Date().toISOString(),
    coverage: dataset?.coverage ?? null,
  }
}

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
        async ({ request }) => {
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

          const base = await withCache(
            `rankings:type=${type}`,
            RANKINGS_CACHE_TTL_SECONDS,
            () => buildRankingsBase(type)
          )

          const rankings = base.rankings.slice(0, limit)
          const districtSpotlight = buildDistrictSpotlight(rankings, typeParam)

          const payload = {
            type: type,
            limit,
            rankings,
            districtSpotlight,
            generatedAt: base.generatedAt,
            dataState: resolveRankingsDataState({ count: rankings.length, coverage: base.coverage ?? undefined }),
          }

          if (format === 'csv') {
            return csvResponse({
              headers: ['stationId', 'turnoverScore', 'emptyHours', 'fullHours', 'totalHours'],
              rows: payload.rankings.map((r) => [r.stationId, r.turnoverScore, r.emptyHours, r.fullHours, r.totalHours]),
              filename: 'rankings.csv',
            })
          }

          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      ),
    },
  },
})
