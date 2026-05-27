import { createFileRoute, redirect } from '@tanstack/react-router'
import { appRoutes } from '@/lib/routes'

export const Route = createFileRoute('/dashboard/datos/')({
  loader: () => {
    throw redirect({ to: appRoutes.dashboard(), search: { mode: 'data' } })
  },
})
