import { createFileRoute, redirect } from '@tanstack/react-router'
import { DASHBOARD_VIEW_MODES, resolveDashboardViewMode } from '@/lib/dashboard-modes'
import { appRoutes } from '@/lib/routes'

export const Route = createFileRoute('/dashboard/views/$mode')({
  loader: ({ params }) => {
    const mode = resolveDashboardViewMode(params.mode)
    const location = DASHBOARD_VIEW_MODES.includes(mode)
      ? `${appRoutes.dashboard()}?mode=${encodeURIComponent(mode)}`
      : appRoutes.dashboard()
    throw redirect({ to: location })
  },
})
