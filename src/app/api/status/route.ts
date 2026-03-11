import { NextRequest, NextResponse } from 'next/server'
import { getStatus } from '@/lib/metrics'

export const dynamic = 'force-dynamic'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

function toCsv(status: Awaited<ReturnType<typeof getStatus>>): string {
  const rows = [
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
  ];

  return ['metric,value', ...rows.map(([metric, value]) => `${metric},"${String(value).replaceAll('"', '""')}"`)].join('\n')
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
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const format = new URL(_request.url).searchParams.get('format')
    const status = await getStatus()

    if (format === 'csv') {
      return new NextResponse(toCsv(status), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="system-status.csv"',
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
          ...CORS_HEADERS,
        },
      })
    }
    
    return NextResponse.json(status, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 30 seconds - metrics update frequently but not instantly
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        ...CORS_HEADERS
      }
    })
  } catch (error) {
    console.error('[API Status] Error fetching status:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to fetch pipeline status',
        timestamp: new Date().toISOString()
      },
      {
        status: 500,
        headers: {
          ...CORS_HEADERS
        }
      }
    )
  }
}

/**
 * CORS handling for status endpoint
 * Allows dashboard clients to fetch status from different origins
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, {
    status: 200,
    headers: CORS_HEADERS
  })
}
