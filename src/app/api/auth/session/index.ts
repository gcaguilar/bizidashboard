import { createFileRoute } from '@tanstack/react-router'
import { isDeveloperLoginConfigured } from '@/lib/auth/auth0-web'
import { getDeveloperSession, isDeveloperSessionConfigured } from '@/lib/auth/developer-session'

function json(body: { email: string | null; configured: boolean }): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const Route = createFileRoute('/api/auth/session/')({
  server: {
    handlers: {
      GET: async () => {
        const configured = isDeveloperSessionConfigured() && isDeveloperLoginConfigured()

        if (!isDeveloperSessionConfigured()) {
          return json({ email: null, configured })
        }

        const session = await getDeveloperSession()

        return json({ email: session?.email ?? null, configured })
      },
    },
  },
})
