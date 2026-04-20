import { buildRobotsTxt } from '@/lib/robots-txt';

export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(buildRobotsTxt(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
