import { createFileRoute } from '@tanstack/react-router'
import { buildRobotsTxt } from '@/lib/robots-txt'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(buildRobotsTxt(), {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          },
        }),
    },
  },
})
