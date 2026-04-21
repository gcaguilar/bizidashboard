import { NextResponse } from 'next/server';
import { getOAuthMetadata } from '@/lib/oauth';

export const dynamic = 'force-static';

export function GET(): Response {
  return NextResponse.json(getOAuthMetadata(), {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
