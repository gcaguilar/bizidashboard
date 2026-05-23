import { createFileRoute } from '@tanstack/react-router'
import { DataStateNotice } from '@/app/_components/DataStateNotice'
import { PublicPageLoading } from '@/app/_components/PublicPageLoading'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { TrackedLink } from '@/app/_components/TrackedLink';
import { createReportBreadcrumb } from '@/lib/breadcrumbs'
import { shouldShowDataStateNotice } from '@/lib/data-state'
import { formatMonthLabel } from '@/lib/months'
import { appRoutes } from '@/lib/routes'
import { formatInteger, formatPercent } from '@/lib/format'
import { PageShell } from '@/components/layout/page-shell'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import { getReportMonthPageData } from '@/server-functions/informes-month'
import { getSiteUrl } from '@/lib/site'

export const Route = createFileRoute('/informes/$month')({
  loader: async ({ params }) => getReportMonthPageData({ data: params.month }),
  head: (opts) => {
    const month = opts.params.month ?? ''
    const title = `Informe ${formatMonthLabel(month)} - DatosBizi`
    const description = `Informe mensual de Bizi Zaragoza para ${formatMonthLabel(month)}: demanda estimada, estaciones y patrones de uso.`
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${getSiteUrl()}/informes/${month}` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${getSiteUrl()}/informes/${month}` }],
      title,
    }
  },
  pendingComponent: PublicPageLoading,
  component: InformesMonthPage,
})

function InformesMonthPage() {
  const { month, monthRow, nearbyMonths, dataState } = Route.useLoaderData()
  const breadcrumbs = createReportBreadcrumb(formatMonthLabel(month))

  return (
    <PageShell>
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      <header className="ui-page-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Informe mensual</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Informe {formatMonthLabel(month)}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">Resumen mensual con demanda estimada, estaciones y patrones del periodo seleccionado.</p>
          </div>
        </div>
      </header>
      {shouldShowDataStateNotice(dataState) ? (
        <DataStateNotice state={dataState} subject="el informe mensual" description="Este informe depende de los datos historicos disponibles. Revisa el estado si ves huecos o cobertura parcial." href={appRoutes.status()} actionLabel="Revisar estado" />
      ) : null}
      {monthRow ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <article className="ui-section-card"><p className="stat-label">Demanda estimada</p><p className="stat-value">{formatInteger(monthRow.demandScore)}</p></article>
            <article className="ui-section-card"><p className="stat-label">Ocupación media</p><p className="stat-value">{formatPercent(monthRow.avgOccupancy)}</p></article>
            <article className="ui-section-card"><p className="stat-label">Estaciones activas</p><p className="stat-value">{formatInteger(monthRow.activeStations)}</p></article>
            <article className="ui-section-card"><p className="stat-label">Muestras</p><p className="stat-value">{formatInteger(monthRow.sampleCount)}</p></article>
          </section>
          <section className="grid gap-4 lg:grid-cols-3">
            <article className="ui-section-card lg:col-span-2">
              <h2 className="text-xl font-black text-[var(--foreground)]">Resumen del mes</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                <p>En {formatMonthLabel(month)}, DatosBizi estima {formatInteger(monthRow.demandScore)} puntos de demanda agregada con una ocupación media del {formatPercent(monthRow.avgOccupancy)}.</p>
                <p>La serie incluye {formatInteger(monthRow.sampleCount)} muestras y {formatInteger(monthRow.activeStations)} estaciones activas. Usa esta lectura como resumen público; para análisis operativo fino, entra al dashboard filtrado por mes.</p>
              </div>
            </article>
            <article className="ui-section-card">
              <h2 className="text-xl font-black text-[var(--foreground)]">Acciones</h2>
              <div className="mt-4 flex flex-col gap-2">
                <TrackedLink href={appRoutes.dashboardConclusions({ month })} ctaEvent={{ source: 'report_month', ctaId: 'open_dashboard', destination: 'dashboard_conclusions', entityType: 'report', monthPresent: true, sourceRole: 'hub', destinationRole: 'dashboard', transitionKind: 'to_dashboard' }} className="ui-primary-button">Abrir dashboard de este mes</TrackedLink>
                <TrackedLink href={appRoutes.statsViajes()} ctaEvent={{ source: 'report_month', ctaId: 'view_series', destination: 'stats_viajes', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-inline-action">Ver serie acumulada</TrackedLink>
                <TrackedLink href={appRoutes.reports()} ctaEvent={{ source: 'report_month', ctaId: 'back_to_archive', destination: 'report_archive', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-inline-action">Volver al archivo</TrackedLink>
              </div>
            </article>
          </section>
          {nearbyMonths.length > 0 ? (
            <section className="ui-section-card">
              <h2 className="text-xl font-black text-[var(--foreground)]">Otros informes</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {nearbyMonths.map((relatedMonth) => (
                  <TrackedLink key={relatedMonth} href={appRoutes.reportMonth(relatedMonth)} ctaEvent={{ source: 'report_month', ctaId: 'nearby_month', destination: 'monthly_report', entityType: 'report', monthPresent: true, sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-inline-action">{formatMonthLabel(relatedMonth)}</TrackedLink>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <EmptyStateCard
          title="Informe en preparación"
          description="Este mes todavía no tiene informe publicado. Los informes se generan automáticamente cuando hay cobertura suficiente."
        />
      )}
    </PageShell>
  )
}
