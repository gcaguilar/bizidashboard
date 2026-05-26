import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { rowsToCsv } from '@/lib/csv'
import { resolveHistoryDataState } from '@/lib/data-state'
import { withPublicApiRoute } from '@/lib/security/public-api-route'
import { getHistoryMetadata, getPipelineStatusSummary } from '@/services/shared-data'

type DailyHistoryRow = {
  day: string
  demandScore: number
  avgOccupancy: number
  sampleCount: number
  balanceIndex: number
}

const HISTORY_CSV_HEADERS = ['day', 'demandScore', 'avgOccupancy', 'balanceIndex', 'sampleCount']

function d<T>(v: T | null | undefined, dflt: T): T {
  return v ?? dflt
}

async function buildHistoryPayload() {
  const nowIso = new Date().toISOString()
  const [historyMeta, dailyHistoryRows, status] = await Promise.all([
    getHistoryMetadata().catch(() => ({
      source: {
        provider: 'Bizi Zaragoza GBFS',
        gbfsDiscoveryUrl: 'https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json',
      },
      coverage: {
        firstRecordedAt: null,
        lastRecordedAt: null,
        totalSamples: 0,
        totalStations: 0,
        totalDays: 0,
        generatedAt: nowIso,
      },
      generatedAt: nowIso,
    })),
    // Compute daily history directly from StationStatus so it always
    // reflects the latest ingested data regardless of analytics aggregation.
    prisma.$queryRaw<DailyHistoryRow[]>`
      WITH daily_station AS (
        SELECT
          TO_CHAR("recordedAt", 'YYYY-MM-DD') AS day,
          "stationId",
          AVG("bikesAvailable"::float / NULLIF("bikesAvailable" + "anchorsFree", 0))
            AS "stationAvgOccupancy",
          MAX("bikesAvailable") - MIN("bikesAvailable") AS "bikesRange",
          MAX("anchorsFree") - MIN("anchorsFree") AS "anchorsRange",
          COUNT(*)::int AS "stationSamples"
        FROM "StationStatus"
        GROUP BY TO_CHAR("recordedAt", 'YYYY-MM-DD'), "stationId"
      )
      SELECT
        day,
        SUM("bikesRange" + "anchorsRange") AS "demandScore",
        AVG("stationAvgOccupancy") AS "avgOccupancy",
        AVG(CASE
          WHEN "stationAvgOccupancy" IS NULL THEN 0.5
          WHEN ABS("stationAvgOccupancy" - 0.5) >= 0.5 THEN 0
          ELSE 1 - (2 * ABS("stationAvgOccupancy" - 0.5))
        END) AS "balanceIndex",
        SUM("stationSamples") AS "sampleCount"
      FROM daily_station
      GROUP BY day
      ORDER BY day ASC;
    `.catch(() => [] as DailyHistoryRow[]),
    getPipelineStatusSummary().catch(() => null),
  ])

  const history = dailyHistoryRows.map((row) => ({
    day: row.day,
    demandScore: d(row.demandScore, 0),
    avgOccupancy: d(row.avgOccupancy, 0),
    balanceIndex: d(row.balanceIndex, 0),
    sampleCount: d(row.sampleCount, 0),
  }))

  return {
    source: historyMeta.source,
    coverage: historyMeta.coverage,
    history,
    generatedAt: historyMeta.generatedAt ?? nowIso,
    dataState: resolveHistoryDataState({
      count: history.length,
      coverage: historyMeta.coverage,
      status,
      expectedDays: 30,
    }),
  }
}

export const Route = createFileRoute('/api/history/')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: '/api/history',
          routeGroup: 'api.history',
          namespace: 'public-history',
          limit: 40,
          windowMs: 60_000,
          requireApiKey: false,
          cacheControl: 'public, max-age=300, stale-while-revalidate=120',
        },
        async ({ request, access }) => {
          const format = new URL(request.url).searchParams.get('format')
          const payload = await buildHistoryPayload()

          if (format === 'csv') {
            return new Response(rowsToCsv(HISTORY_CSV_HEADERS, payload.history), {
              status: 200,
              headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="history-balance.csv"',
                ...access.headers,
              },
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
