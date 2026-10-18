import { createFileRoute } from '@tanstack/react-router'
import { DataStateNotice } from '@/app/_components/DataStateNotice'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { TrackedLink } from '@/app/_components/TrackedLink';
import { buildBreadcrumbStructuredData, createReportBreadcrumb } from '@/lib/breadcrumbs'
import { shouldShowDataStateNotice } from '@/lib/data-state'
import { formatMonthLabel } from '@/lib/months'
import { appRoutes } from '@/lib/routes'
import { formatInteger, formatPercent, formatRatioDelta } from '@/lib/format'
import { PageShell } from '@/components/layout/page-shell'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import { getReportMonthPageData } from '@/server-functions/informes-month'
import { getSiteUrl } from '@/lib/site'
import { RouteErrorReporter } from '@/lib/route-error-reporting'
import { buildObservatoryEvent } from '@/lib/umami'
import { toJsonLdScript } from '@/lib/structured-data';
import { DemandFlowCard } from '@/app/dashboard/_components/DemandFlowCard';
import { ReportSummary } from '@/app/informes/_components/ReportSummary';
import { ReportCharts } from '@/app/informes/_components/ReportCharts';
import { ReportDistricts } from '@/app/informes/_components/ReportDistricts';
import { ReportProblems } from '@/app/informes/_components/ReportProblems';
import { ReportAnomalies } from '@/app/informes/_components/ReportAnomalies';
import { ReportConclusions } from '@/app/informes/_components/ReportConclusions';
import { ReportRedistribution } from '@/app/informes/_components/ReportRedistribution';

export const Route = createFileRoute('/informes/$month')({
  loader: async ({ params }) => getReportMonthPageData({ data: params.month }),
  head: (opts) => {
    const month = opts.params.month ?? ''
    const monthPath = appRoutes.reportMonth(month)
    const title = `Informe ${formatMonthLabel(month)} - DatosBizi`
    const description = `Informe mensual de Bizi Zaragoza para ${formatMonthLabel(month)}: resumen ejecutivo, evolución, barrios y problemas recurrentes del servicio.`
    return {
      meta: [
        { title },
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'DatosBizi' },
        { property: 'og:locale', content: 'es_ES' },
        { property: 'og:url', content: `${getSiteUrl()}${monthPath}` },
        { name: 'robots', content: opts.loaderData?.monthRow ? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' : 'noindex, follow' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${getSiteUrl()}${monthPath}` }],
      title,
    }
  },
  errorComponent: InformesMonthErrorPage,
  component: InformesMonthPage,
})

function InformesMonthErrorPage({ error }: { error: unknown }) {
  return (
    <PageShell>
      <RouteErrorReporter error={error} area="route.reports.month" />
      <section className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Informe no disponible</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
          No se pudo cargar este informe mensual
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          Intenta recargar en unos minutos o vuelve al archivo de informes para abrir otro periodo.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <TrackedLink href={appRoutes.reports()} className="ui-primary-button">Volver al archivo</TrackedLink>
          <TrackedLink href={appRoutes.status()} className="ui-inline-action">Ver estado</TrackedLink>
        </div>
      </section>
    </PageShell>
  );
}

function InformesMonthPage() {
  const { month, monthRow, report, nearbyMonths, dataState } = Route.useLoaderData()
  const monthLabel = formatMonthLabel(month)
  const breadcrumbs = createReportBreadcrumb(monthLabel)
  const structuredData = monthRow
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          buildBreadcrumbStructuredData(breadcrumbs),
          {
            '@type': 'Article',
            headline: `Actividad de Bizi Zaragoza en ${monthLabel}`,
            description: `Informe mensual con resumen ejecutivo, evolución, barrios y problemas recurrentes de Bizi Zaragoza en ${monthLabel}.`,
            inLanguage: 'es',
            mainEntityOfPage: `${getSiteUrl()}${appRoutes.reportMonth(month)}`,
            author: { '@type': 'Organization', name: 'DatosBizi', url: getSiteUrl() },
            publisher: { '@type': 'Organization', name: 'DatosBizi', url: getSiteUrl() },
          },
        ],
      }
    : null

  return (
    <PageShell>
      {structuredData ? (
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: toJsonLdScript(structuredData) }} />
      ) : null}
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      <header className="ui-page-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Informe mensual</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Informe {monthLabel}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Un informe claro para entender qué pasó en la red: cómo evolucionó el uso, qué barrios destacaron y dónde se repitieron los problemas.
            </p>
            {report.coverage.expectedDays > 0 ? (
              <p className="mt-3 text-xs font-semibold text-[var(--primary)]">
                {report.coverage.label} · {report.coverage.coveredDays} de {report.coverage.expectedDays} días disponibles.
              </p>
            ) : null}
          </div>
        </div>
      </header>
      {shouldShowDataStateNotice(dataState) ? (
        <DataStateNotice state={dataState} subject="el informe mensual" description="Este informe depende de los datos históricos disponibles. Revisa el estado si ves huecos o cobertura parcial." href={appRoutes.status()} actionLabel="Revisar estado" />
      ) : null}
      {monthRow ? (
        <>
          <ReportSummary report={report} />

          <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <article className="ui-section-card">
              <p className="stat-label">Movimiento estimado</p>
              <p className="stat-value">{formatInteger(report.headline.demandScore)}</p>
              <p className="text-xs text-[var(--muted)]">
                {report.headline.demandDeltaRatio !== null
                  ? `${formatRatioDelta(report.headline.demandDeltaRatio)} vs mes anterior`
                  : 'Sin comparación disponible'}
              </p>
            </article>
            <article className="ui-section-card">
              <p className="stat-label">Ocupación media</p>
              <p className="stat-value">{formatPercent(report.headline.avgOccupancy)}</p>
              <p className="text-xs text-[var(--muted)]">
                {report.headline.occupancyDeltaRatio !== null
                  ? `${formatRatioDelta(report.headline.occupancyDeltaRatio)} vs mes anterior`
                  : 'Sin comparación disponible'}
              </p>
            </article>
            <article className="ui-section-card">
              <p className="stat-label">Estaciones activas</p>
              <p className="stat-value">{formatInteger(report.headline.activeStations)}</p>
            </article>
            <article className="ui-section-card">
              <p className="stat-label">Días analizados</p>
              <p className="stat-value">{report.coverage.coveredDays}</p>
              <p className="text-xs text-[var(--muted)]">de {report.coverage.expectedDays} días del mes</p>
            </article>
            <article className="ui-section-card">
              <p className="stat-label">Hora punta</p>
              <p className="stat-value">
                {report.headline.peakHour !== null ? `${String(report.headline.peakHour).padStart(2, '0')}:00` : '—'}
              </p>
            </article>
            <article className="ui-section-card">
              <p className="stat-label">Picos anómalos</p>
              <p className="stat-value">{report.anomalies.length}</p>
              <p className="text-xs text-[var(--muted)]">días fuera de lo habitual</p>
            </article>
          </section>

          <ReportCharts report={report} />

          <DemandFlowCard
            dailyDemand={report.trends.daily}
            windowLabel={monthLabel}
            requestedDays={report.coverage.expectedDays}
          />

          <ReportDistricts report={report} />

          <ReportProblems report={report} />

          <ReportRedistribution report={report} />

          <ReportAnomalies report={report} />

          <ReportConclusions report={report} />

          <section className="grid gap-4 lg:grid-cols-3">
            <article className="ui-section-card lg:col-span-2">
              <h2 className="text-xl font-black text-[var(--foreground)]">Sigue explorando</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <TrackedLink href={appRoutes.dashboardConclusions({ month })} ctaEvent={{ source: 'report_month', ctaId: 'open_dashboard', destination: 'dashboard_conclusions', entityType: 'report', monthPresent: true, sourceRole: 'hub', destinationRole: 'dashboard', transitionKind: 'to_dashboard' }} className="ui-primary-button">Analizar este mes</TrackedLink>
                <TrackedLink href={appRoutes.statsViajes()} ctaEvent={{ source: 'report_month', ctaId: 'view_series', destination: 'stats_viajes', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-inline-action">Ver la serie mensual</TrackedLink>
                <TrackedLink href={appRoutes.statsBarrios()} ctaEvent={{ source: 'report_month', ctaId: 'view_districts', destination: 'stats_barrios', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-inline-action">Comparar barrios</TrackedLink>
                <TrackedLink href={appRoutes.reports()} trackingEvent={buildObservatoryEvent('report_opened', { surface: 'public', routeKey: 'monthly_report', source: 'report_month_archive' })} className="ui-inline-action">Volver al archivo</TrackedLink>
              </div>
            </article>
            <article className="ui-section-card">
              <h2 className="text-xl font-black text-[var(--foreground)]">Otros informes</h2>
              {nearbyMonths.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--muted)]">No hay otros meses publicados todavía.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {nearbyMonths.map((relatedMonth) => (
                    <TrackedLink key={relatedMonth} href={appRoutes.reportMonth(relatedMonth)} ctaEvent={{ source: 'report_month', ctaId: 'nearby_month', destination: 'monthly_report', entityType: 'report', monthPresent: true, sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-inline-action">{formatMonthLabel(relatedMonth)}</TrackedLink>
                  ))}
                </div>
              )}
            </article>
          </section>
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
