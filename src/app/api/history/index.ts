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

async function buildHistoryPayload() {
  const [historyMeta, dailyHistoryRows, status] = await Promise.all([
    getHistoryMetadata(),
    prisma.$queryRaw<DailyHistoryRow[]>`
      SELECT
        TO_CHAR("bucketStart", 'YYYY-MM-DD') AS day,
        SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) AS "demandScore",
        AVG("occupancyAvg") AS "avgOccupancy",
        AVG(CASE
          WHEN "occupancyAvg" IS NULL THEN 0.5
          WHEN ABS("occupancyAvg" - 0.5) >= 0.5 THEN 0
          ELSE 1 - (2 * ABS("occupancyAvg" - 0.5))
        END) AS "balanceIndex",
        SUM("sampleCount") AS "sampleCount"
      FROM "HourlyStationStat"
      WHERE "occupancyAvg" IS NOT NULL
      GROUP BY TO_CHAR("bucketStart", 'YYYY-MM-DD')
      ORDER BY day ASC;
    `,
    getPipelineStatusSummary().catch(() => null),
  ])

  const history = dailyHistoryRows.map((row) => ({
    day: row.day,
    demandScore: Number(row.demandScore ?? 0),
    avgOccupancy: Number(row.avgOccupancy ?? 0),
    balanceIndex: Number(row.balanceIndex ?? 0),
    sampleCount: Number(row.sampleCount ?? 0),
  }))

  return {
    source: historyMeta.source,
    coverage: historyMeta.coverage,
    history,
    generatedAt: historyMeta.generatedAt ?? new Date().toISOString(),
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
