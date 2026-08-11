import { createFileRoute } from '@tanstack/react-router'
import { getOAuthScope } from '@/lib/oauth'
import { getSiteUrl } from '@/lib/site'

export const Route = createFileRoute('/.well-known/oauth-protected-resource')({
  server: {
    handlers: {
      GET: () => {
        const domain = process.env.AUTH0_DOMAIN?.trim()

        return new Response(
          JSON.stringify({
            resource: getSiteUrl(),
            authorization_servers: domain ? [`https://${domain}/`] : [],
            bearer_methods_supported: ['header'],
            scopes_supported: [getOAuthScope()],
            resource_documentation: `${getSiteUrl()}/developers`,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      },
    },
  },
})
