import { createFileRoute, redirect } from '@tanstack/react-router'
import { DASHBOARD_VIEW_MODES, resolveDashboardViewMode } from '@/lib/dashboard-modes'
import { appRoutes } from '@/lib/routes'

export const Route = createFileRoute('/dashboard/views/$mode')({
  loader: ({ params }) => {
    const mode = resolveDashboardViewMode(params.mode)
    throw redirect({
      to: appRoutes.dashboard(),
      search: DASHBOARD_VIEW_MODES.includes(mode) ? { mode } : {},
    })
  },
})
