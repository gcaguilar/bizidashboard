import { NextRequest, NextResponse } from 'next/server'
import { getStatus } from '@/lib/metrics'

export const dynamic = 'force-dynamic'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
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
    const status = await getStatus()
    
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
export async function OPTIONS(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({}, {
    status: 200,
    headers: CORS_HEADERS
  })
}
