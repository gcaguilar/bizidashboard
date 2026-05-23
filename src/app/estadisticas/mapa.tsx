import { createFileRoute } from '@tanstack/react-router'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker'
import { TrackedLink } from '@/app/_components/TrackedLink';
import { createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { formatPercent } from '@/lib/format'
import { appRoutes } from '@/lib/routes'
import { getSiteUrl } from '@/lib/site'
import { getUtilityLandingPageData } from '@/server-functions/seo-details'
import { PageShell } from '@/components/layout/page-shell'

export const Route = createFileRoute('/estadisticas/mapa')({
  loader: () => getUtilityLandingPageData(),
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Mapa en vivo Bizi Zaragoza - DatosBizi'
    const description = 'Mapa interactivo con disponibilidad actual de bicis y huecos en todas las estaciones Bizi Zaragoza.'
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/estadisticas/mapa` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      link: [{ rel: 'canonical', href: `${siteUrl}/estadisticas/mapa` }],
      title,
    }
  },
  component: MapaPage,
})

function MapaPage() {
  const landingData = Route.useLoaderData()
  const breadcrumbs = createRootBreadcrumbs({ label: 'Mapa Bizi Zaragoza', href: appRoutes.statsMapa() })

  return (
    <PageShell>
      <PublicPageViewTracker pageType="tool" template="map_entry" pageSlug="mapa" />
      <SiteBreadcrumbs items={breadcrumbs} />

      <header className="ui-page-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Mapa interactivo</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">Disponibilidad en tiempo real</h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">Abre el mapa para localizar estaciones con bicis o huecos libres. Datos actualizados cada pocos minutos.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="ui-chip">{landingData.stationRows.length} estaciones</span>
            <span className="ui-chip">{landingData.bikesAvailable} bicis ahora</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <TrackedLink
            href={appRoutes.dashboardView('overview')}
            ctaEvent={{ source: 'mapa_page', ctaId: 'open_map', destination: 'dashboard_overview', sourceRole: 'hub', destinationRole: 'dashboard', transitionKind: 'to_dashboard' }}
            className="ui-primary-button"
          >
            Abrir mapa interactivo
          </TrackedLink>
          <TrackedLink
            href={appRoutes.statsEstaciones()}
            ctaEvent={{ source: 'mapa_page', ctaId: 'browse_stations', destination: 'stats_estaciones', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }}
            className="ui-inline-action"
          >
            Ver estaciones en lista
          </TrackedLink>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="ui-section-card">
          <p className="stat-label">Para coger bici</p>
          <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Busca estaciones con bicis</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Usa el mapa o filtra el directorio por estaciones con bicis disponibles.</p>
          <TrackedLink href={appRoutes.statsEstaciones()} ctaEvent={{ source: 'mapa_page', ctaId: 'filter_bikes', destination: 'stats_estaciones', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-inline-action mt-3">Filtrar estaciones</TrackedLink>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Para devolver</p>
          <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Comprueba huecos libres</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Evita estaciones llenas revisando ocupación antes de moverte.</p>
          <TrackedLink href={appRoutes.statsEstaciones()} ctaEvent={{ source: 'mapa_page', ctaId: 'check_slots', destination: 'stats_estaciones', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-inline-action mt-3">Revisar huecos</TrackedLink>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Por zona</p>
          <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Explora por barrio</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Si no tienes estación concreta, revisa disponibilidad agrupada por barrios.</p>
          <TrackedLink href={appRoutes.statsBarrios()} ctaEvent={{ source: 'mapa_page', ctaId: 'by_district', destination: 'stats_barrios', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-inline-action mt-3">Ver barrios</TrackedLink>
        </article>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Estaciones destacadas</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {landingData.featuredStations.map((row) => (
            <TrackedLink key={row.station.id} className="ui-metric-card block" href={appRoutes.stationDetail(row.station.id)} entitySelectEvent={{ source: 'mapa_featured', entityType: 'station', entityId: row.station.id, destination: 'station_detail', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }}>
              <p className="font-semibold text-[var(--foreground)]">{row.station.name}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{row.station.bikesAvailable} bicis · ocupacion {formatPercent(row.currentOccupancy)}</p>
            </TrackedLink>
          ))}
        </div>
      </section>
    </PageShell>
  )
}