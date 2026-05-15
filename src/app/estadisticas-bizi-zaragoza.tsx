import { createFileRoute } from '@tanstack/react-router'
import { PublicSectionNav } from '@/app/_components/PublicSectionNav'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { formatDecimal } from '@/lib/format'
import { formatMonthLabel } from '@/lib/months'
import { appRoutes } from '@/lib/routes'
import { getSiteUrl } from '@/lib/site'
import { buildItemListStructuredData } from '@/lib/structured-data'
import { getInsightsLandingPageData } from '@/server-functions/seo-details'
import { PageShell } from '@/components/layout/page-shell'

export const Route = createFileRoute('/estadisticas-bizi-zaragoza')({
  loader: () => getInsightsLandingPageData(),
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Estadisticas y ranking de Bizi Zaragoza - DatosBizi'
    const description = 'Rankings, barrios activos, informes mensuales y patrones de uso de Bizi Zaragoza.'
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}${appRoutes.insightsLanding()}` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}${appRoutes.insightsLanding()}` }],
      title,
    }
  },
  component: InsightsLandingPage,
})

function InsightsLandingPage() {
  const landingData = Route.useLoaderData()
  const topDistrict = landingData.districtRows[0] ?? null
  const siteUrl = getSiteUrl()
  const breadcrumbs = createRootBreadcrumbs({ label: 'Estadisticas Bizi Zaragoza', href: appRoutes.insightsLanding() })
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Estadisticas y ranking de Bizi Zaragoza',
        description: 'Landing de descubrimiento con rankings, barrios, informes y rutas relacionadas de Bizi Zaragoza.',
        url: `${siteUrl}${appRoutes.insightsLanding()}`,
        inLanguage: 'es',
      },
      buildItemListStructuredData('Empieza por aqui', [
        ...(landingData.latestMonth ? [{ name: `Ultimo informe ${formatMonthLabel(landingData.latestMonth)}`, url: `${siteUrl}${appRoutes.reportMonth(landingData.latestMonth)}` }] : []),
        { name: 'Barrios', url: `${siteUrl}${appRoutes.districtLanding()}` },
        { name: 'Horas punta', url: `${siteUrl}${appRoutes.seoPage('uso-bizi-por-hora')}` },
        { name: 'API y datos abiertos', url: `${siteUrl}${appRoutes.developers()}` },
      ]),
    ],
  }

  return (
    <PageShell>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="ui-page-hero">
        <SiteBreadcrumbs items={breadcrumbs} />
        <PublicSectionNav activeItemId="explore" className="mt-1" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Landing de descubrimiento</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">Estadisticas y ranking de Bizi Zaragoza</h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">Rankings, barrios, informes mensuales y fichas publicas de estacion para entender mejor el sistema.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="ui-chip">{landingData.stationRows.length} estaciones indexables</span>
            <span className="ui-chip">{landingData.districtRows.length} barrios con cobertura</span>
            <span className="ui-chip">{landingData.publishedMonths.length} meses publicados</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {landingData.latestMonth ? <a className="inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95" href={appRoutes.reportMonth(landingData.latestMonth)}>Abrir ultimo informe mensual</a> : null}
          <a className="ui-inline-action" href={appRoutes.seoPage('ranking-estaciones-bizi')}>Ver ranking de estaciones</a>
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="ui-section-card"><p className="stat-label">Ultimo mes publicado</p><p className="stat-value">{landingData.latestMonth ? formatMonthLabel(landingData.latestMonth) : 'Sin datos'}</p></article>
        <article className="ui-section-card"><p className="stat-label">Barrio destacado</p><p className="text-sm font-semibold leading-snug text-[var(--foreground)]">{topDistrict?.name ?? 'Sin datos'}</p><p className="text-xs text-[var(--muted)]">{topDistrict ? `${formatDecimal(topDistrict.avgTurnover)} pts medios en ${topDistrict.stationCount} estaciones.` : 'Esperando cobertura territorial suficiente.'}</p></article>
        <article className="ui-section-card"><p className="stat-label">Bicis visibles</p><p className="stat-value">{landingData.bikesAvailable}</p></article>
      </section>
      <section className="ui-section-card">
        <div className="max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Que puedes descubrir aqui</p>
            <h2 className="text-xl font-black leading-tight text-[var(--foreground)]">Una ruta de entrada para entender el sistema sin perderte</h2>
          </div>
          <p>Si buscas una lectura rapida de como se mueve Bizi Zaragoza, aqui tienes el hilo logico: empezar por el ultimo informe o el ranking de estaciones, bajar despues a los barrios con mas actividad y terminar en las fichas publicas de estacion.</p>
          <p>Esta estructura evita crear paginas debiles y concentra autoridad en pocos hubs utiles. Tambien deja un recorrido claro para campanas: trafico frio a esta landing, CTA al informe o al ranking y navegacion interna hacia barrios y estaciones.</p>
        </div>
      </section>
      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Empieza por aqui</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <a className="ui-metric-card block" href={appRoutes.districtLanding()}>Barrios de Zaragoza</a>
          <a className="ui-metric-card block" href={appRoutes.seoPage('uso-bizi-por-hora')}>Horas punta</a>
          <a className="ui-metric-card block" href={appRoutes.developers()}>API y datos abiertos</a>
          {landingData.latestMonth ? <a className="ui-metric-card block" href={appRoutes.reportMonth(landingData.latestMonth)}>Ultimo informe {formatMonthLabel(landingData.latestMonth)}</a> : null}
        </div>
      </section>
      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Estaciones para seguir</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {landingData.featuredStations.map((station) => (
            <a key={station.station.id} className="ui-surface-block ui-surface-block-interactive" href={appRoutes.stationDetail(station.station.id)}>
              <p className="text-sm font-semibold text-[var(--foreground)]">{station.station.name}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{station.districtName ?? 'Zaragoza'} · rotacion {formatDecimal(station.turnover?.turnoverScore ?? null)}</p>
            </a>
          ))}
        </div>
      </section>
      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Siguiente paso segun tu objetivo</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <a className="ui-surface-block ui-surface-block-interactive" href={appRoutes.utilityLanding()}><p className="text-sm font-semibold text-[var(--foreground)]">Quiero resolver algo practico</p><p className="mt-1 text-[11px] text-[var(--muted)]">Pasa a la landing de utilidad inmediata para ver mapa, disponibilidad y accesos rapidos.</p></a>
          <a className="ui-surface-block ui-surface-block-interactive" href={appRoutes.dashboardConclusions()}><p className="text-sm font-semibold text-[var(--foreground)]">Quiero ir al detalle operativo</p><p className="mt-1 text-[11px] text-[var(--muted)]">Abre conclusiones del dashboard si ya necesitas metricas y lectura tactica.</p></a>
        </div>
      </section>
    </PageShell>
  )
}
