import { NextRequest, NextResponse } from 'next/server'
import { rowsToCsv } from '@/lib/csv'
import { errorResponse } from '@/lib/api-response'
import { resolveStatusDataState } from '@/lib/data-state'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { withApiRequest } from '@/lib/security/http'
import { getPipelineStatusSummary } from '@/services/shared-data'

export const dynamic = 'force-dynamic'

const STATUS_CSV_HEADERS = ['metric', 'value']

function statusToRows(status: Awaited<ReturnType<typeof getPipelineStatusSummary>>) {
  return [
    ['timestamp', status.timestamp],
    ['healthStatus', status.pipeline.healthStatus],
    ['healthReason', status.pipeline.healthReason ?? ''],
    ['lastSuccessfulPoll', status.pipeline.lastSuccessfulPoll ?? ''],
    ['totalRowsCollected', status.pipeline.totalRowsCollected],
    ['pollsLast24Hours', status.pipeline.pollsLast24Hours],
    ['validationErrors', status.pipeline.validationErrors],
    ['consecutiveFailures', status.pipeline.consecutiveFailures],
    ['recentStationCount', status.quality.volume.recentStationCount],
    ['averageStationsPerPoll', status.quality.volume.averageStationsPerPoll],
    ['freshnessLastUpdated', status.quality.freshness.lastUpdated ?? ''],
    ['isFresh', status.quality.freshness.isFresh],
    ['environment', status.system.environment],
    ['version', status.system.version],
  ]
}

/**
 * GET /api/status
 * 
 * Returns pipeline status and metrics for the observability dashboard.
 * 
 * Response includes:
 * - Pipeline metrics (last poll, total rows, validation errors, health)
 * - Data quality metrics (freshness, volume)
 * - System info (uptime, version)
 * 
 * @returns {Promise<NextResponse>} JSON response with status data
 */
export async function GET(_request: NextRequest): Promise<Response> {
  return withApiRequest(
    _request,
    {
      route: '/api/status',
      routeGroup: 'public.status',
    },
    async () => {
      try {
        const format = new URL(_request.url).searchParams.get('format')
        const status = await getPipelineStatusSummary()
        const payload = {
          ...status,
          dataState: resolveStatusDataState(status),
        }

        if (format === 'csv') {
          const csv = rowsToCsv(STATUS_CSV_HEADERS, statusToRows(status) as unknown as Record<string, unknown>[]);
          return new NextResponse(csv, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': 'attachment; filename="system-status.csv"',
              'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
            },
          });
        }

        return NextResponse.json(payload, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
          }
        })
      } catch (error) {
        captureExceptionWithContext(error, {
          area: 'api.status',
          operation: 'GET /api/status',
          extra: {
            format: new URL(_request.url).searchParams.get('format'),
          },
        })
        logger.error('api.status.failed', { error })

        return errorResponse('Failed to fetch pipeline status', 500)
      }
    }
  )
}
