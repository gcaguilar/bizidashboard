import { createFileRoute } from '@tanstack/react-router'
import { getStationRankings, type RankingType } from '@/analytics/queries/read'
import { getStationsWithLatestStatus } from '@/analytics/queries/read'
import { fetchDistrictCollection } from '@/lib/districts'
import { buildDistrictSpotlight, enrichRankingRows, buildPeakFullHoursByStation, attachPeakFullHours } from '@/lib/ranking-enrichment'
import { buildStationDistrictMap } from '@/lib/districts'
import { getSharedDatasetSnapshot } from '@/services/shared-data'
import { resolveRankingsDataState } from '@/lib/data-state'
import { withApiRequest } from '@/lib/security/http'
import { errorResponse } from '@/lib/api-response'
import { enforcePublicApiAccess } from '@/lib/security/public-api'

export const Route = createFileRoute('/api/rankings')({
  server: {
    handlers: {
      GET: async (opts) => {
        const request = opts?.request

        if (!request) {
          try {
            const [rankings, stations, dataset] = await Promise.all([
              getStationRankings('turnover', 50),
              getStationsWithLatestStatus(),
              getSharedDatasetSnapshot().catch(() => null),
            ])
            const stationNameById = new Map(stations.map((s) => [s.id, s.name]))
            const enriched = enrichRankingRows(rankings, stationNameById, new Map())
            const payload = {
              type: 'turnover',
              limit: 50,
              rankings: enriched,
              districtSpotlight: [],
              generatedAt: new Date().toISOString(),
              dataState: resolveRankingsDataState({ count: enriched.length, coverage: dataset?.coverage }),
            }

            return new Response(JSON.stringify(payload), {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=300' },
            })
          } catch (error) {
            return new Response(JSON.stringify({ error: 'Failed to fetch rankings', dataState: 'error' }), { status: 500 })
          }
        }

        return withApiRequest(
          request,
          { route: '/api/rankings', routeGroup: 'public.api' },
          async ({ requestId, clientIp, userAgent }) => {
            try {
              const typeParam = new URL(request.url).searchParams.get('type') ?? 'turnover'
              const type = typeParam as RankingType
              const limitParam = parseInt(new URL(request.url).searchParams.get('limit') ?? '20')
              const limit = Math.min(Math.max(1, limitParam), 200)
              const format = new URL(request.url).searchParams.get('format')

              const access = await enforcePublicApiAccess({
                route: '/api/rankings',
                request,
                requestId,
                clientIp,
                userAgent,
                namespace: 'public-rankings',
                limit: 40,
                windowMs: 60_000,
                requireApiKey: false,
              })

              if (!access.ok) return access.response

              const [rankings, stations, districtCollection, dataset] = await Promise.all([
                getStationRankings(type, limit),
                getStationsWithLatestStatus(),
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
              const districtSpotlight = buildDistrictSpotlight(enriched, typeParam as RankingType)

              const payload = {
                type: type as 'turnover' | 'availability',
                limit,
                rankings: enriched,
                districtSpotlight,
                generatedAt: new Date().toISOString(),
                dataState: resolveRankingsDataState({ count: enriched.length, coverage: dataset?.coverage }),
              }

              if (format === 'csv') {
                const headers = ['stationId', 'turnoverScore', 'emptyHours', 'fullHours', 'totalHours']
                const rows = payload.rankings.map((r) => [r.stationId, r.turnoverScore, r.emptyHours, r.fullHours, r.totalHours])
                const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
                return new Response(csv, {
                  status: 200,
                  headers: { 'Content-Type': 'text/csv; charset=utf-8', ...access.headers },
                })
              }

              return new Response(JSON.stringify(payload), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=300', ...access.headers },
              })
            } catch (error) {
              return errorResponse('Failed to fetch rankings', 500)
            }
          }
        )
      },
    },
  },
})
