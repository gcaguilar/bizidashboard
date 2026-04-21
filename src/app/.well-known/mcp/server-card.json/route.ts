import { NextResponse } from 'next/server';
import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-static';

export function GET(): Response {
  const siteUrl = getSiteUrl();

  return NextResponse.json(
    {
      serverInfo: {
        name: 'BiziDashboard MCP',
        version: '0.1.0',
      },
      transport: {
        type: 'streamable-http',
        endpoint: `${siteUrl}/mcp`,
      },
      capabilities: {
        tools: true,
        resources: false,
        prompts: false,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    }
  );
}
