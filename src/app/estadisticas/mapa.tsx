import { createFileRoute, redirect } from '@tanstack/react-router'
import { appRoutes } from '@/lib/routes'

export const Route = createFileRoute('/estadisticas/mapa')({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
    title: 'Mapa en vivo - redirigiendo...',
  }),
  loader: () => {
    throw redirect({ to: appRoutes.dashboard(), replace: true })
  },
})
