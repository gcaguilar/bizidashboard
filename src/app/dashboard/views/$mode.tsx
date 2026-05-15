import { createFileRoute } from '@tanstack/react-router'
import { DASHBOARD_VIEW_MODES, resolveDashboardViewMode } from '@/lib/dashboard-modes'
import { appRoutes } from '@/lib/routes'

export const Route = createFileRoute('/dashboard/views/$mode')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const mode = resolveDashboardViewMode(params.mode)
        const location = DASHBOARD_VIEW_MODES.includes(mode)
          ? `${appRoutes.dashboard()}?mode=${encodeURIComponent(mode)}`
          : appRoutes.dashboard()

        return new Response(null, { status: 302, headers: { Location: location } })
      },
    },
  },
  loader: ({ params }) => {
    const mode = resolveDashboardViewMode(params.mode)
    return { mode: DASHBOARD_VIEW_MODES.includes(mode) ? mode : 'overview' }
  },
  component: DashboardViewRedirectPage,
})

function DashboardViewRedirectPage() {
  const { mode } = Route.useLoaderData()
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-black text-[var(--foreground)]">Vista del dashboard</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">Esta ruta redirige a la vista seleccionada del dashboard.</p>
      <a className="ui-inline-action mt-4" href={`${appRoutes.dashboard()}?mode=${encodeURIComponent(mode)}`}>Abrir dashboard</a>
    </main>
  )
}
