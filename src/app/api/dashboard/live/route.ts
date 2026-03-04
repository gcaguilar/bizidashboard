import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DashboardApiClient } from '@/mcp/dashboard-api-client'
import { generateDashboard } from '@/mcp/dashboard-generator'

export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  request: z.string().min(1),
  stationId: z.string().min(1).optional(),
  rankLimit: z.number().int().min(1).max(100).optional(),
  alertLimit: z.number().int().min(1).max(200).optional(),
  mobilityDays: z.number().int().min(1).max(90).optional(),
  demandDays: z.number().int().min(1).max(120).optional()
})

function parseTimeoutMs(rawValue: string | undefined): number {
  if (!rawValue) {
    return 20_000
  }

  const parsed = Number.parseInt(rawValue, 10)

  if (!Number.isInteger(parsed) || parsed < 1_000 || parsed > 120_000) {
    return 20_000
  }

  return parsed
}

function resolveApiBaseUrl(request: NextRequest): string {
  return (
    process.env.BIZIDASHBOARD_API_BASE_URL ??
    process.env.APP_URL ??
    request.nextUrl.origin
  )
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: z.infer<typeof requestSchema>

  try {
    const body = await request.json()
    payload = requestSchema.parse(body)
  } catch (error) {
    const details =
      error instanceof z.ZodError
        ? error.issues.map((issue) => issue.message).join('; ')
        : 'Request body must be valid JSON.'

    return NextResponse.json(
      {
        error: 'Invalid request payload',
        details
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    )
  }

  try {
    const client = new DashboardApiClient({
      baseUrl: resolveApiBaseUrl(request),
      timeoutMs: parseTimeoutMs(process.env.BIZIDASHBOARD_API_TIMEOUT_MS)
    })

    const dashboard = await generateDashboard(payload.request, client, {
      stationId: payload.stationId,
      rankLimit: payload.rankLimit,
      alertLimit: payload.alertLimit,
      mobilityDays: payload.mobilityDays,
      demandDays: payload.demandDays
    })

    return NextResponse.json(dashboard, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error('[API Dashboard Live] Error generating dashboard:', error)

    return NextResponse.json(
      {
        error: 'Failed to generate dashboard',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    )
  }
}
