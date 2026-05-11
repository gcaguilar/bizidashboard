import { redirect, createFileRoute } from '@tanstack/react-router'
import { DASHBOARD_MODE_META, DASHBOARD_VIEW_MODES, resolveDashboardViewMode } from '@/lib/dashboard-modes'
import { appRoutes } from '@/lib/routes'

export const Route = createFileRoute('/dashboard/views/mode')({
  loader: async ({ params }) => {
    const { mode } = params
    if (!mode || !DASHBOARD_VIEW_MODES.includes(resolveDashboardViewMode(mode))) {
      throw redirect({ to: appRoutes.dashboard() })
    }
    return { mode }
  },
  component: DashboardViewModePage,
})

function DashboardViewModePage() {
  const { mode } = Route.useParams()
  return <div>Dashboard view mode: {mode}</div>
}
