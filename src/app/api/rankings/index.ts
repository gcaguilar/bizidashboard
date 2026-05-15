import { createFileRoute } from '@tanstack/react-router'
import { getStationRankings } from '@/analytics/queries/read'
import { getStationsWithLatestStatus } from '@/analytics/queries/read'
import { fetchDistrictCollection } from '@/lib/districts.server'
import { buildDistrictSpotlight, enrichRankingRows, buildPeakFullHoursByStation, attachPeakFullHours } from '@/lib/ranking-enrichment'
import { buildStationDistrictMap } from '@/lib/districts'
import { getSharedDatasetSnapshot } from '@/services/shared-data'
import { resolveRankingsDataState } from '@/lib/data-state'
import { errorResponse } from '@/lib/api-response'
import { enforcePublicApiAccess } from '@/lib/security/public-api'

export const Route = createFileRoute('/api/rankings/')({
  server: {
    handlers: {
      GET: async (opts) => {
        const request = opts.request
        try {
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

          const access = await enforcePublicApiAccess({
            route: '/api/rankings',
            request,
            requestId: '',
            clientIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
            userAgent: request.headers.get('user-agent') || '',
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
        } catch {
          return errorResponse('Failed to fetch rankings', 500)
        }
      },
    },
  },
})
