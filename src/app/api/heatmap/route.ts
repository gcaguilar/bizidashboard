import { NextRequest, NextResponse } from 'next/server'
import { getHeatmap } from '@/analytics/queries/read'
import { withCache } from '@/lib/cache/cache'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const stationId = searchParams.get('stationId')

  if (!stationId) {
    return NextResponse.json(
      { error: 'stationId query parameter is required' },
      { status: 400 }
    )
  }

  try {
    const cacheKey = `heatmap:stationId=${stationId}`
    const heatmap = await withCache(cacheKey, 300, () =>
      getHeatmap(stationId)
    )

    return NextResponse.json(heatmap, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('[API Heatmap] Error fetching heatmap:', error)

    return NextResponse.json(
      { error: 'Failed to fetch station heatmap' },
      { status: 500 }
    )
  }
}
