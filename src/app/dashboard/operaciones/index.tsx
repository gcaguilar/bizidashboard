import { createFileRoute, redirect } from '@tanstack/react-router'
import { appRoutes } from '@/lib/routes'

export const Route = createFileRoute('/dashboard/operaciones/')({
  loader: () => {
    throw redirect({ href: `${appRoutes.dashboard()}?mode=${encodeURIComponent('operations')}` })
  },
})
