import { createFileRoute } from '@tanstack/react-router'
import { createSentryTunnelRoute, registerSentryServerTunnelRoute } from '@sentry/tanstackstart-react'
import { SENTRY_TUNNEL_PATH } from '@/lib/sentry-config'

/**
 * Tunel de Sentry: el navegador envia los eventos a este mismo origen (los
 * bloqueadores no lo filtran) y el servidor los reenvia al DSN configurado.
 *
 * Sustituye a la ruta virtual que inyecta `sentryTanstackStart({ tunnelRoute })`:
 * esa ruta no pasa por el compilador de rutas, su handler llega al bundle del
 * cliente y su `import('@sentry/tanstackstart-react')` obligaba a conservar el
 * SDK entero (Replay, Feedback, Canvas...) en el chunk de entrada.
 */
if (import.meta.env.SSR) {
  // Descarta la transaccion propia del tunel desde la primera peticion.
  registerSentryServerTunnelRoute(SENTRY_TUNNEL_PATH)
}

export const Route = createFileRoute('/api/relay')({
  server: {
    handlers: {
      POST: ({ request }) => createSentryTunnelRoute({}).handlers.POST({ request }),
      // Sin handler para un metodo, TanStack Start renderizaria la app por SSR.
      ANY: () => new Response(null, { status: 405, headers: { Allow: 'POST' } }),
    },
  },
})
