import { createFileRoute } from '@tanstack/react-router'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { TrackedLink } from '@/app/_components/TrackedLink';
import { createDistrictBreadcrumb } from '@/lib/breadcrumbs'
import { formatDecimal } from '@/lib/format'
import { appRoutes } from '@/lib/routes'
import { getSiteUrl } from '@/lib/site'
import { buildItemListStructuredData } from '@/lib/structured-data'
import { getPublicDistrictPageData } from '@/server-functions/seo-details'
import { PageShell } from '@/components/layout/page-shell'

export const Route = createFileRoute('/estadisticas/barrios/$districtSlug')({
  loader: ({ params }) => getPublicDistrictPageData({ data: params.districtSlug }),
  head: ({ params }) => {
    const slug = params.districtSlug ?? ''
    const districtPath = appRoutes.districtDetail(slug)
    const title = `Barrio ${slug} - DatosBizi`
    const description = `Estaciones, disponibilidad y patrones de uso de Bizi en el barrio ${slug} de Zaragoza.`
    return {
      meta: [
        { title },
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${getSiteUrl()}${districtPath}` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${getSiteUrl()}${districtPath}` }],
      title,
    }
  },
  errorComponent: DistrictErrorPage,
  component: DistrictPage,
})

function DistrictErrorPage() {
  return (
    <PageShell>
      <section className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Barrio no disponible</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--foreground)]">No se pudo cargar esta ficha de barrio</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">Intenta de nuevo en unos minutos o vuelve a la comparativa general de barrios.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <TrackedLink className="ui-primary-button" href={appRoutes.statsBarrios()}>Ver barrios</TrackedLink>
          <TrackedLink className="ui-inline-action" href={appRoutes.status()}>Ver estado</TrackedLink>
        </div>
      </section>
    </PageShell>
  );
}

function DistrictPage() {
  const { district, districts } = Route.useLoaderData()
  const { districtSlug } = Route.useParams()

  if (!district) {
    const label = districtSlug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
    return (
      <PageShell>
        <section className="ui-page-hero">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Ficha de barrio</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--foreground)]">Bizi en {label}</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">Aun no hay datos suficientes para mostrar este barrio con confianza.</p>
          <TrackedLink className="ui-inline-action mt-4" href={appRoutes.statsBarrios()} ctaEvent={{ source: 'district_empty', ctaId: 'back_to_districts', destination: 'stats_barrios', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }}>Ver comparativa de barrios</TrackedLink>
        </section>
      </PageShell>
    )
  }

  const siblings = districts.filter((row) => row.slug !== district.slug).slice(0, 4)
  const cityAverageTurnover = districts.length > 0 ? districts.reduce((sum, row) => sum + row.avgTurnover, 0) / districts.length : 0
  const cityAverageAvailabilityRisk = districts.length > 0 ? districts.reduce((sum, row) => sum + row.avgAvailabilityRisk, 0) / districts.length : 0
  const siteUrl = getSiteUrl()
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `${district.name}: uso de Bizi, estaciones y actividad en Zaragoza`,
        description: `Analiza el uso de Bizi en ${district.name}, descubre sus estaciones mas activas y compara la actividad del barrio con Zaragoza.`,
        url: `${siteUrl}/estadisticas/barrios/${district.slug}`,
        inLanguage: 'es',
      },
      buildItemListStructuredData('Estaciones destacadas', district.topStations.map((station) => ({ name: station.stationName, url: `${siteUrl}${appRoutes.stationDetail(station.stationId)}` }))),
    ],
  }
  const breadcrumbs = createDistrictBreadcrumb(district.name)

  return (
    <PageShell>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Ficha publica de barrio</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">Bizi en {district.name}</h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          Estaciones, bicis disponibles y actividad agregada del barrio.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-4">
        <article className="ui-section-card"><p className="stat-label">Estaciones</p><p className="stat-value">{district.stationCount}</p></article>
        <article className="ui-section-card"><p className="stat-label">Bicis</p><p className="stat-value">{district.bikesAvailable}</p></article>
        <article className="ui-section-card"><p className="stat-label">Huecos</p><p className="stat-value">{district.anchorsFree}</p></article>
        <article className="ui-section-card"><p className="stat-label">Rotacion media</p><p className="stat-value">{formatDecimal(district.avgTurnover)}</p></article>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <article className="ui-section-card lg:col-span-2">
          <h2 className="text-xl font-black text-[var(--foreground)]">Resumen del barrio</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
            <p>{district.name} concentra {district.stationCount} estaciones Bizi con {district.bikesAvailable} bicis visibles y {district.anchorsFree} anclajes libres en este momento.</p>
            <p>Su rotacion media es {formatDecimal(district.avgTurnover)} frente a {formatDecimal(cityAverageTurnover)} de media en los barrios con cobertura. El riesgo medio de disponibilidad es {formatDecimal(district.avgAvailabilityRisk)} frente a {formatDecimal(cityAverageAvailabilityRisk)}.</p>
          </div>
        </article>
        <article className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Como usar esta ficha</h2>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">Empieza por las estaciones destacadas si necesitas disponibilidad concreta. Usa la comparativa de barrios para entender que zonas tienen mas actividad o mas tension.</p>
          <TrackedLink className="ui-inline-action mt-4" href={appRoutes.advancedMap()} ctaEvent={{ source: 'district_detail', ctaId: 'view_map', destination: 'stats_map', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }}>Abrir mapa avanzado</TrackedLink>
        </article>
      </section>
      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Estaciones destacadas</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {district.topStations.map((station) => (
            <TrackedLink key={station.stationId} className="ui-metric-card block" href={appRoutes.stationDetail(station.stationId)} entitySelectEvent={{ source: 'district_stations', entityType: 'station', module: station.stationId }}>
              <p className="font-semibold text-[var(--foreground)]">{station.stationName}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{station.bikesAvailable} bicis · {station.anchorsFree} huecos</p>
            </TrackedLink>
          ))}
        </div>
      </section>
      {siblings.length > 0 ? (
        <section className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Otros barrios</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {siblings.map((sibling) => <TrackedLink key={sibling.slug} className="ui-inline-action" href={appRoutes.districtDetail(sibling.slug)} ctaEvent={{ source: 'district_detail', ctaId: 'sibling_district', destination: sibling.slug, sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }}>{sibling.name}</TrackedLink>)}
          </div>
        </section>
      ) : null}
    </PageShell>
  )
}
