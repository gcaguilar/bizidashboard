import { createFileRoute, redirect } from '@tanstack/react-router'
import { appRoutes } from '@/lib/routes'

export const Route = createFileRoute('/estadisticas/mapa')({
  head: () => {
    const title = 'Mapa en vivo - redirigiendo...'
    return {
      meta: [
        { title },
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'noindex, nofollow' },
      ],
      title,
    }
  },
  loader: () => {
    throw redirect({ to: appRoutes.dashboard(), replace: true })
  },
})
