import { NextResponse } from 'next/server'
import { openApiDocument } from '@/lib/openapi-document'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(openApiDocument, {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
