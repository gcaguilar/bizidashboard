import { createFileRoute } from '@tanstack/react-router'
import { PublicSectionNav } from '@/app/_components/PublicSectionNav'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { formatPercent } from '@/lib/format'
import { appRoutes } from '@/lib/routes'
import { getSiteUrl } from '@/lib/site'
import { buildItemListStructuredData } from '@/lib/structured-data'
import { getUtilityLandingPageData } from '@/server-functions/seo-details'
import { PageShell } from '@/components/layout/page-shell'

const FAQ_ITEMS = [
  {
    question: 'Donde ver que estacion tiene bicis ahora mismo?',
    answer: 'En esta landing tienes accesos al mapa en vivo y a fichas publicas de estacion con disponibilidad actual, ocupacion y contexto historico reciente.',
  },
  {
    question: 'Puedo encontrar una estacion cercana antes de abrir el dashboard?',
    answer: 'Si. Las estaciones destacadas enlazan a su ficha publica y desde ahi puedes bajar al detalle operativo completo o seguir navegando por barrio.',
  },
  {
    question: 'Que hago si busco una lectura rapida y no un analisis completo?',
    answer: 'Lo mas util es abrir el dashboard en vista resumen o la ficha publica de una estacion concreta. Si buscas contexto adicional, usa despues el hub de barrios o el archivo mensual.',
  },
] as const

export const Route = createFileRoute('/mapa-estaciones-bizi-zaragoza')({
  loader: () => getUtilityLandingPageData(),
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Mapa y estaciones Bizi Zaragoza en tiempo real - DatosBizi'
    const description = 'Encuentra estaciones Bizi Zaragoza, revisa disponibilidad actual y entra al mapa en vivo.'
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/mapa-estaciones-bizi-zaragoza` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/mapa-estaciones-bizi-zaragoza` }],
      title,
    }
  },
  component: UtilityLandingPage,
})

function UtilityLandingPage() {
  const landingData = Route.useLoaderData()
  const siteUrl = getSiteUrl()
  const breadcrumbs = createRootBreadcrumbs({ label: 'Mapa y estaciones Bizi Zaragoza', href: appRoutes.utilityLanding() })
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Mapa y estaciones Bizi Zaragoza en tiempo real',
        description: 'Landing de utilidad inmediata para encontrar estaciones, revisar disponibilidad y saltar al dashboard en vivo.',
        url: `${siteUrl}${appRoutes.utilityLanding()}`,
        inLanguage: 'es',
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
      buildItemListStructuredData(
        'Estaciones destacadas para empezar',
        landingData.featuredStations.map((station) => ({ name: station.station.name, url: `${siteUrl}${appRoutes.stationDetail(station.station.id)}` }))
      ),
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
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Landing de utilidad inmediata</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">Mapa y estaciones Bizi Zaragoza en tiempo real</h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">Encuentra estaciones, comprueba bicis o anclajes libres y salta al dashboard en vivo o a fichas publicas por estacion.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="ui-chip">{landingData.stationRows.length} estaciones publicas</span>
            <span className="ui-chip">{landingData.bikesAvailable} bicis visibles</span>
            <span className="ui-chip">{landingData.districtRows.length} barrios conectados</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <a className="inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95" href={appRoutes.dashboardView('overview')}>Abrir dashboard en vista resumen</a>
          <a className="ui-inline-action" href={appRoutes.seoPage('uso-bizi-por-estacion')}>Explorar estaciones</a>
        </div>
      </header>
      <section className="grid gap-4 xl:grid-cols-3">
        <article className="ui-section-card"><p className="stat-label">Paso 1</p><h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Localiza la zona</h2><p className="mt-2 text-sm text-[var(--muted)]">Usa el mapa o entra por barrio si ya sabes en que parte de Zaragoza te vas a mover.</p></article>
        <article className="ui-section-card"><p className="stat-label">Paso 2</p><h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Revisa disponibilidad</h2><p className="mt-2 text-sm text-[var(--muted)]">Cada ficha publica muestra bicis, anclajes libres, ocupacion y comparacion frente a la media.</p></article>
        <article className="ui-section-card"><p className="stat-label">Paso 3</p><h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Baja al detalle operativo</h2><p className="mt-2 text-sm text-[var(--muted)]">Salta al dashboard para ver alertas, mapas y patrones completos.</p></article>
      </section>
      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Estaciones destacadas para empezar</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {landingData.featuredStations.map((row) => (
            <a key={row.station.id} className="ui-metric-card block" href={appRoutes.stationDetail(row.station.id)}>
              <p className="font-semibold text-[var(--foreground)]">{row.station.name}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{row.station.bikesAvailable} bicis · ocupacion {formatPercent(row.currentOccupancy)}</p>
            </a>
          ))}
        </div>
      </section>
      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Preguntas habituales</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          {FAQ_ITEMS.map((item) => (
            <article key={item.question} className="ui-surface-block">
              <p className="text-sm font-semibold text-[var(--foreground)]">{item.question}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Mas rutas utiles</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <a className="ui-surface-block ui-surface-block-interactive" href={appRoutes.districtLanding()}><p className="text-sm font-semibold text-[var(--foreground)]">Barrios de Zaragoza</p><p className="mt-1 text-[11px] text-[var(--muted)]">Entra por zona si tu decision depende mas del barrio que de una estacion concreta.</p></a>
          <a className="ui-surface-block ui-surface-block-interactive" href={appRoutes.status()}><p className="text-sm font-semibold text-[var(--foreground)]">Estado del sistema</p><p className="mt-1 text-[11px] text-[var(--muted)]">Verifica cobertura y frescura del dato si notas huecos o lecturas parciales.</p></a>
          <a className="ui-surface-block ui-surface-block-interactive" href={appRoutes.biciradar()}><p className="text-sm font-semibold text-[var(--foreground)]">BiciRadar</p><p className="mt-1 text-[11px] text-[var(--muted)]">App movil para seguir disponibilidad y accesos desde el telefono.</p></a>
          <a className="ui-surface-block ui-surface-block-interactive" href={appRoutes.insightsLanding()}><p className="text-sm font-semibold text-[var(--foreground)]">Ir a estadisticas</p><p className="mt-1 text-[11px] text-[var(--muted)]">Cambia a una lectura de ranking, barrios e informes.</p></a>
        </div>
      </section>
    </PageShell>
  )
}
