import { createFileRoute, redirect, notFound } from '@tanstack/react-router'
import { PageShell } from '@/components/layout/page-shell'

export const Route = createFileRoute('/$')({
  loader: async ({ params }) => {
    const path = params._splat ?? ''

    const redirects: Record<string, string> = {
      inicio: '/',
      'api/docs': '/developers',
    }

    if (path in redirects) {
      throw redirect({ to: redirects[path], replace: true })
    }

    if (path.startsWith('zaragoza/')) {
      const rest = path.slice('zaragoza/'.length)
      if (rest) {
        throw redirect({ to: `/${rest}`, replace: true })
      }
    }

    if (path.startsWith('dashboard/status')) {
      throw redirect({ to: '/estado', replace: true })
    }

    throw notFound()
  },
  notFoundComponent: NotFoundPage,
})

function NotFoundPage() {
  return (
    <PageShell>
      <section className="ui-page-hero py-24 text-center">
        <h1 className="text-4xl font-black text-[var(--foreground)]">Pagina no encontrada</h1>
        <p className="mt-4 text-sm text-[var(--muted)]">La ruta que buscas no existe o ha sido movida.</p>
        <a href="/" className="ui-inline-action mt-6">Volver al inicio</a>
      </section>
    </PageShell>
  )
}
