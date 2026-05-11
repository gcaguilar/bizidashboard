import { createFileRoute, redirect } from '@tanstack/react-router'
import { DataStateNotice } from '@/app/_components/DataStateNotice'
import { PublicSectionNav } from '@/app/_components/PublicSectionNav'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { fetchCachedMonthlyDemandCurve } from '@/lib/analytics-series'
import { createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { shouldShowDataStateNotice } from '@/lib/data-state'
import { formatMonthLabel, isValidMonthKey } from '@/lib/months'
import { appRoutes } from '@/lib/routes'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { buildFallbackDatasetSnapshot } from '@/lib/shared-data-fallbacks'
import { PageShell } from '@/components/layout/page-shell'

export const Route = createFileRoute('/informes/month')({
  loader: async ({ params }) => {
    const month = (params as { month?: string }).month ?? ''
    if (!month || !isValidMonthKey(month)) {
      throw redirect({ to: appRoutes.reports() })
    }
    const nowIso = new Date().toISOString()
    try {
      await fetchCachedMonthlyDemandCurve().catch(() => buildFallbackDatasetSnapshot(nowIso))
      return { month, dataState: 'ok' as const }
    } catch (error) {
      captureExceptionWithContext(error, { area: 'informes.month', operation: 'loader' })
      return { month, dataState: 'error' as const }
    }
  },
  head: (opts) => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    title: `Informe ${formatMonthLabel((opts.params as { month?: string }).month ?? '')} - DatosBizi`,
  }),
  component: InformesMonthPage,
})

function InformesMonthPage() {
  const { month, dataState } = Route.useLoaderData()
  const breadcrumbs = createRootBreadcrumbs({ label: 'Informes', href: appRoutes.reports() })

  return (
    <PageShell>
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      <PublicSectionNav activeItemId="reports" className="mt-1" />
      <header className="ui-page-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Informe mensual</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Informe {formatMonthLabel(month)}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">Curva de demanda y metricas del mes seleccionado.</p>
          </div>
        </div>
      </header>
      {shouldShowDataStateNotice(dataState) ? (
        <DataStateNotice state={dataState} subject="el informe mensual" description="Los datos del informe dependen del estado del dataset." href={appRoutes.status()} actionLabel="Ver estado" />
      ) : null}
      <section className="ui-section-card">
        <p className="text-sm text-[var(--muted)]">Proximamente: curva de demanda y metricas para {formatMonthLabel(month)}.</p>
      </section>
    </PageShell>
  )
}
