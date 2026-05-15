import { createFileRoute } from '@tanstack/react-router'
import { PublicSectionNav } from '@/app/_components/PublicSectionNav'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { formatDecimal } from '@/lib/format'
import { appRoutes } from '@/lib/routes'
import { getSiteUrl } from '@/lib/site'
import { buildItemListStructuredData } from '@/lib/structured-data'
import { getPublicDistrictPageData } from '@/server-functions/seo-details'
import { PageShell } from '@/components/layout/page-shell'

export const Route = createFileRoute('/barrios/$districtSlug')({
  loader: ({ params }) => getPublicDistrictPageData({ data: params.districtSlug }),
  head: ({ params }) => {
    const slug = params.districtSlug ?? ''
    const title = `Barrio ${slug} - DatosBizi`
    const description = `Estaciones, disponibilidad y patrones de uso de Bizi en el barrio ${slug} de Zaragoza.`
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${getSiteUrl()}/barrios/${slug}` },
      ],
      link: [{ rel: 'canonical', href: `${getSiteUrl()}/barrios/${slug}` }],
      title,
    }
  },
  component: DistrictPage,
})

function DistrictPage() {
  const { district, districts } = Route.useLoaderData()
  const { districtSlug } = Route.useParams()

  if (!district) {
    const label = districtSlug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
    return (
      <PageShell>
        <PublicSectionNav activeItemId="explore" className="mt-1" />
        <section className="ui-page-hero">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Ficha de barrio</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--foreground)]">Bizi en {label}</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">Aun no hay datos suficientes para mostrar este barrio con confianza.</p>
          <a className="ui-inline-action mt-4" href={appRoutes.districtLanding()}>Ver comparativa de barrios</a>
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
        url: `${siteUrl}${appRoutes.districtDetail(district.slug)}`,
        inLanguage: 'es',
      },
      buildItemListStructuredData('Estaciones destacadas', district.topStations.map((station) => ({ name: station.stationName, url: `${siteUrl}${appRoutes.stationDetail(station.stationId)}` }))),
    ],
  }
  const breadcrumbs = createRootBreadcrumbs(
    { label: 'Barrios', href: appRoutes.districtLanding() },
    { label: district.name, href: appRoutes.districtDetail(district.slug) }
  )

  return (
    <PageShell>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      <PublicSectionNav activeItemId="explore" className="mt-1" />
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
          <a className="ui-inline-action mt-4" href={appRoutes.dashboardView('research')}>Abrir analisis en el dashboard</a>
        </article>
      </section>
      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Estaciones destacadas</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {district.topStations.map((station) => (
            <a key={station.stationId} className="ui-metric-card block" href={appRoutes.stationDetail(station.stationId)}>
              <p className="font-semibold text-[var(--foreground)]">{station.stationName}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{station.bikesAvailable} bicis · {station.anchorsFree} huecos</p>
            </a>
          ))}
        </div>
      </section>
      {siblings.length > 0 ? (
        <section className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Otros barrios</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {siblings.map((sibling) => <a key={sibling.slug} className="ui-inline-action" href={appRoutes.districtDetail(sibling.slug)}>{sibling.name}</a>)}
          </div>
        </section>
      ) : null}
      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Rutas relacionadas</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <a className="ui-surface-block ui-surface-block-interactive" href={appRoutes.districtLanding()}><p className="text-sm font-semibold text-[var(--foreground)]">Comparativa de barrios</p><p className="mt-1 text-[11px] text-[var(--muted)]">Vuelve a la vista territorial para comparar zonas.</p></a>
          <a className="ui-surface-block ui-surface-block-interactive" href={appRoutes.utilityLanding()}><p className="text-sm font-semibold text-[var(--foreground)]">Mapa y estaciones</p><p className="mt-1 text-[11px] text-[var(--muted)]">Salta a una lectura mas practica de disponibilidad.</p></a>
          <a className="ui-surface-block ui-surface-block-interactive" href={appRoutes.insightsLanding()}><p className="text-sm font-semibold text-[var(--foreground)]">Estadisticas</p><p className="mt-1 text-[11px] text-[var(--muted)]">Continua con rankings e informes mensuales.</p></a>
        </div>
      </section>
    </PageShell>
  )
}
