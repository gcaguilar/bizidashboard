import { createFileRoute } from '@tanstack/react-router'
import { buildLlmsTxt } from '@/app/llms[.]txt'

export const Route = createFileRoute('/llm-txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(buildLlmsTxt(), {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
            Link: '</llms.txt>; rel="canonical"',
          },
        }),
    },
  },
})
