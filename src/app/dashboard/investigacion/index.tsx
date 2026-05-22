import { createFileRoute } from '@tanstack/react-router'
import { appRoutes } from '@/lib/routes'

export const Route = createFileRoute('/dashboard/investigacion/')({
  server: {
    handlers: {
      GET: () => {
        const location = `${appRoutes.dashboard()}?mode=${encodeURIComponent('research')}`
        return new Response(null, { status: 302, headers: { Location: location } })
      },
    },
  },
  loader: () => {
    return { mode: 'research' as const }
  },
  component: DashboardInvestigacionRedirectPage,
})

function DashboardInvestigacionRedirectPage() {
  const { mode } = Route.useLoaderData()
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-black text-[var(--foreground)]">Vista del dashboard</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">Esta ruta redirige a la vista de investigacion del dashboard.</p>
      <a className="ui-inline-action mt-4" href={`${appRoutes.dashboard()}?mode=${encodeURIComponent(mode)}`}>Abrir dashboard</a>
    </main>
  )
}
