import { createFileRoute } from '@tanstack/react-router'
import { getDeveloperSession, isDeveloperSessionConfigured } from '@/lib/auth/developer-session'

export const Route = createFileRoute('/api/auth/session/')({
  server: {
    handlers: {
      GET: async () => {
        if (!isDeveloperSessionConfigured()) {
          return new Response(JSON.stringify({ email: null }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const session = await getDeveloperSession()

        return new Response(JSON.stringify({ email: session?.email ?? null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
