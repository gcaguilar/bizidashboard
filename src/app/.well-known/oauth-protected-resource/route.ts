import { NextResponse } from 'next/server';
import { getOAuthIssuer, getOAuthScope } from '@/lib/oauth';
import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-static';

export function GET(): Response {
  const siteUrl = getSiteUrl();

  return NextResponse.json(
    {
      resource: `${siteUrl}/api`,
      authorization_servers: [getOAuthIssuer()],
      scopes_supported: [getOAuthScope()],
      bearer_methods_supported: ['header'],
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    }
  );
}
