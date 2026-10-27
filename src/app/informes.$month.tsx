import { ActivityIndexHint } from '@/app/_components/ActivityIndexHint';
import { activityIndexUnits } from '@/lib/product-copy';
import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
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
import {
  DEFAULT_SOCIAL_IMAGE_HEIGHT,
  DEFAULT_SOCIAL_IMAGE_PATH,
  DEFAULT_SOCIAL_IMAGE_WIDTH,
  getSiteUrl,
} from '@/lib/site'
import { RouteErrorReporter } from '@/lib/route-error-reporting'
import { buildObservatoryEvent } from '@/lib/umami'
import { toJsonLdScript } from '@/lib/structured-data';
import { DemandFlowCard } from '@/app/dashboard/_components/DemandFlowCard';
import { ReportSummary } from '@/app/informes/_components/ReportSummary';
import { ReportDistricts } from '@/app/informes/_components/ReportDistricts';
import { ReportProblems } from '@/app/informes/_components/ReportProblems';
import { ReportAnomalies } from '@/app/informes/_components/ReportAnomalies';
import { ReportConclusions } from '@/app/informes/_components/ReportConclusions';
import { ReportExportBar } from '@/app/informes/_components/ReportExportBar';
import { ReportRedistribution } from '@/app/informes/_components/ReportRedistribution';

// recharts y d3 son pesados y solo se necesitan en esta pagina: cargarlos en
// un chunk aparte evita incluirlos en el bundle inicial del informe.
const loadReportCharts = () =>
  import('@/app/informes/_components/ReportCharts').then((module) => ({
    default: module.ReportCharts,
  }));
const ReportCharts = lazy(loadReportCharts);

// El chunk perezoso no sale como modulepreload en el HTML: sin esto, el
// navegador no empieza a bajar recharts (~120 KB gz) hasta hidratar la pagina.
// Pedirlo al evaluar el chunk de la ruta lo solapa con la hidratacion.
if (typeof window !== 'undefined') {
  void loadReportCharts();
}

type ReportMonthPageData = Awaited<ReturnType<typeof getReportMonthPageData>>;

/** El mes en curso es parcial y cambia durante el dia. */
export const REPORTS_LIVE_CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600';
/**
 * Un mes cerrado esta sellado. Cloudflare puede servirlo desde edge; si un
 * backfill lo invalida, el edge puede tardar como maximo una semana en
 * refrescarlo (o antes si la revalidacion en segundo plano tiene exito).
 */
export const REPORTS_CLOSED_CACHE_CONTROL =
  'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800';

export const Route = createFileRoute('/informes/$month')({
  loader: async ({ params }): Promise<ReportMonthPageData> =>
    getReportMonthPageData({ data: params.month }),
  head: (opts) => {
    const month = opts.params.month ?? ''
    const monthPath = appRoutes.reportMonth(month)
    const monthLabel = formatMonthLabel(month)
    const title = `Informe ${monthLabel} - DatosBizi`
    const description = `Informe mensual de Bizi Zaragoza para ${monthLabel}: resumen ejecutivo, evolución, barrios y problemas recurrentes del servicio.`
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
        { property: 'og:image', content: `${getSiteUrl()}${DEFAULT_SOCIAL_IMAGE_PATH}` },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: String(DEFAULT_SOCIAL_IMAGE_WIDTH) },
        { property: 'og:image:height', content: String(DEFAULT_SOCIAL_IMAGE_HEIGHT) },
        { property: 'og:image:alt', content: `DatosBizi · Informe ${monthLabel}` },
        { property: 'og:url', content: `${getSiteUrl()}${monthPath}` },
        { property: 'article:published_time', content: `${month}-01T00:00:00.000Z` },
        { property: 'article:modified_time', content: opts.loaderData?.report?.generatedAt ?? `${month}-01T00:00:00.000Z` },
        { name: 'robots', content: opts.loaderData?.monthRow ? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' : 'noindex, follow' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: `${getSiteUrl()}${DEFAULT_SOCIAL_IMAGE_PATH}` },
        { name: 'twitter:image:alt', content: `DatosBizi · Informe ${monthLabel}` },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${getSiteUrl()}${monthPath}` }],
      title,
    }
  },
  errorComponent: InformesMonthErrorPage,
  component: InformesMonthPage,
  // `headers` va al final a proposito: declararlo antes del loader hace que
  // TypeScript pierda la inferencia de `loaderData` en `head` y `useLoaderData`.
  headers: ({ params }) => {
    const month = params.month ?? '';
    const currentMonth = new Date().toISOString().slice(0, 7);

    return {
      'Cache-Control':
        month < currentMonth ? REPORTS_CLOSED_CACHE_CONTROL : REPORTS_LIVE_CACHE_CONTROL,
    };
  },
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

function ReportChartsFallback() {
  return (
    <section className="ui-section-card" aria-busy="true">
      <p className="text-sm text-[var(--muted)]">Cargando gráficos…</p>
    </section>
  );
}

function InformesMonthPage() {
  const { month, monthRow, report, nearbyMonths, dataState } = Route.useLoaderData()
  const monthLabel = formatMonthLabel(month)
  const breadcrumbs = createReportBreadcrumb(monthLabel, appRoutes.reportMonth(month))

  // Los graficos son un chunk perezoso. La pagina espera a que ReportCharts
  // avise de que ya esta montado (o a un margen de seguridad si el informe no
  // tiene graficos) antes de marcar la hidratacion que usa el render de PDF.
  const hasCharts =
    report.trends.monthly.length > 0 ||
    report.trends.hourly.length > 0 ||
    report.heatmap.length > 0

  useEffect(() => {
    let cancelled = false

    const markHydrated = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) {
            document.documentElement.dataset.reportHydrated = 'true'
          }
        })
      })
    }

    const onChartsReady = () => markHydrated()

    // Si los graficos ya se montaron antes de este efecto (el hijo ejecuta su
    // efecto primero), el evento ya paso: el flag evita perderlo.
    if (document.documentElement.dataset.reportChartsReady === 'true') {
      markHydrated()
    } else {
      window.addEventListener('report-charts-ready', onChartsReady, { once: true })
    }

    const fallbackTimer = window.setTimeout(markHydrated, hasCharts ? 5000 : 0)

    return () => {
      cancelled = true
      window.clearTimeout(fallbackTimer)
      window.removeEventListener('report-charts-ready', onChartsReady)
      delete document.documentElement.dataset.reportHydrated
    }
  }, [hasCharts])
  const structuredData = monthRow
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          buildBreadcrumbStructuredData(breadcrumbs),
          {
            '@type': 'Article',
            headline: `Actividad de Bizi Zaragoza en ${monthLabel}`,
            description: `Informe mensual con resumen ejecutivo, evolución, barrios y problemas recurrentes de Bizi Zaragoza en ${monthLabel}.`,
            inLanguage: 'es-ES',
            mainEntityOfPage: `${getSiteUrl()}${appRoutes.reportMonth(month)}`,
            datePublished: `${month}-01T00:00:00.000Z`,
            dateModified: report.generatedAt,
            author: {
              '@type': 'Organization',
              name: 'DatosBizi',
              url: getSiteUrl(),
              sameAs: [
                'https://github.com/gcaguilar/bizidashboard',
                'https://www.linkedin.com/in/guillermocastella/',
              ],
            },
            publisher: { '@id': `${getSiteUrl()}/#organization` },
          },
        ],
      }
    : null

  return (
    <PageShell data-report-print data-report-export-root>
      {structuredData ? (
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: toJsonLdScript(structuredData) }} />
      ) : null}
      <div className="mx-auto mb-4 w-full max-w-[1280px] ui-print-hide">
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

          <ReportExportBar
            month={month}
            shareUrl={`${getSiteUrl()}${appRoutes.reportMonth(month)}`}
            shareText={`Informe de Bizi Zaragoza · ${monthLabel}`}
          />

          <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <article className="ui-section-card">
              <p className="stat-label">Índice de actividad <ActivityIndexHint /></p>
              <p className="stat-value">{formatInteger(report.headline.demandScore)}</p>
              <p className="text-xs text-[var(--muted)]">{activityIndexUnits.total}</p>
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

          <Suspense fallback={<ReportChartsFallback />}>
            <ReportCharts report={report} />
          </Suspense>

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

          <section className="grid gap-4 lg:grid-cols-3 ui-print-hide">
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
