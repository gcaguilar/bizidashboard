import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { buildSeoHead } from '@/lib/seo-head'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { DashboardClient } from '@/app/dashboard/_components/DashboardClient'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PageShell } from '@/components/layout/page-shell'
import { dashboardPageQueryOptions } from '@/server-functions/dashboard'
import { TrackedLink } from '@/app/_components/TrackedLink'
import { appRoutes } from '@/lib/routes'
import { dashboardSearchSchema } from '@/lib/dashboard-search'

export const Route = createFileRoute('/dashboard/')({
  validateSearch: dashboardSearchSchema,
  // Una sola cache para SSR, preload y cliente: el loader la siembra y el componente la lee.
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardPageQueryOptions),
  errorComponent: DashboardErrorPage,
  component: DashboardPage,
  head: () =>
    buildSeoHead({
      title: 'Panel clasico - DatosBizi',
      socialTitle: 'Dashboard Bizi Zaragoza - DatosBizi',
      description:
        'Dashboard operativo en tiempo real de Bizi Zaragoza con mapa de estaciones, alertas, flujo y lecturas del sistema actual.',
      path: appRoutes.dashboard(),
    }),
})

function DashboardErrorPage() {
  return (
    <PageShell>
      <section className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Panel no disponible</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
          No se pudo cargar el dashboard
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          Intenta recargar en unos minutos o revisa el estado del sistema.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <TrackedLink href={appRoutes.status()} className="ui-primary-button">Ver estado</TrackedLink>
          <TrackedLink href={appRoutes.explore()} className="ui-inline-action">Ir a explorar</TrackedLink>
        </div>
      </section>
    </PageShell>
  )
}

function DashboardPage() {
  const { data: { breadcrumbs, initialData, isSchemaMissing, loadErrors, structuredData } } =
    useSuspenseQuery(dashboardPageQueryOptions)

  return (
    <PageShell maxWidthClassName="">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      {loadErrors.length > 0 ? (
        <Alert variant="warning" className='mx-auto mb-6 w-full max-w-[1280px] text-[var(--warning)]'>
          <AlertTitle className='font-semibold'>
            No se pudieron cargar algunos paneles: {loadErrors.join(', ')}.
          </AlertTitle>
          <AlertDescription className='text-[var(--warning)]/80'>
            {isSchemaMissing
              ? 'La base de datos parece no estar inicializada. Ejecuta `bun prisma migrate deploy` con la misma DATABASE_URL del servidor.'
              : 'Revisa los logs del servidor para mas detalles.'}
          </AlertDescription>
        </Alert>
      ) : null}
      <DashboardClient initialData={initialData} />
    </PageShell>
  )
}
