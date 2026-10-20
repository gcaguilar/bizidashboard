import { createFileRoute } from '@tanstack/react-router'
import { csvResponse } from '@/lib/csv'
import { resolveHistoryDataState } from '@/lib/data-state'
import { getHistorySeries } from '@/lib/history-read-model'
import { withPublicApiRoute } from '@/lib/security/public-api-route'
import { getHistoryMetadata, getPipelineStatusSummary } from '@/services/shared-data'

const HISTORY_CSV_HEADERS = ['day', 'demandScore', 'avgOccupancy', 'balanceIndex', 'sampleCount']
const MAX_HISTORY_DAYS = 365

function parseDays(value: string | null): number | null | 'invalid' {
  if (value === null) return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_HISTORY_DAYS) return 'invalid'
  return parsed
}

async function buildHistoryPayload(days?: number) {
  const nowIso = new Date().toISOString()
  const [historyMeta, history, status] = await Promise.all([
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
    // Daily series is cached in Redis (see history-read-model); raw snapshots
    // are only aggregated once per cache window instead of on every request.
    getHistorySeries({ days }),
    getPipelineStatusSummary().catch(() => null),
  ])

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
      // Coverage counts the full rollup history; the series now does too, but
      // the current day is computed live and historical days may be
      // approximate, so the comparison is not meaningful here.
      compareCoverageDays: false,
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
        async ({ request }) => {
          const { searchParams } = new URL(request.url)
          const format = searchParams.get('format')
          const days = parseDays(searchParams.get('days'))

          if (days === 'invalid') {
            return new Response(
              JSON.stringify({ error: `Invalid days parameter. Must be an integer between 1 and ${MAX_HISTORY_DAYS}.` }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const payload = await buildHistoryPayload(days ?? undefined)

          if (format === 'csv') {
            return csvResponse({
              headers: HISTORY_CSV_HEADERS,
              rows: payload.history,
              filename: 'history-balance.csv',
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
