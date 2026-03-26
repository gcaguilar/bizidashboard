import { NextRequest, NextResponse } from 'next/server'
import { appRoutes } from '@/lib/routes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.redirect(new URL(appRoutes.developers(), request.url), 308)
}
