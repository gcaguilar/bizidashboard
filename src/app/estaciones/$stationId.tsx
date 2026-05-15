import { createFileRoute } from '@tanstack/react-router'
import { PublicSectionNav } from '@/app/_components/PublicSectionNav'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { formatHourRange, formatPercent } from '@/lib/format'
import { appRoutes } from '@/lib/routes'
import { getSiteUrl } from '@/lib/site'
import { getPublicStationPageData } from '@/server-functions/seo-details'
import { PageShell } from '@/components/layout/page-shell'

function formatDayTypeLabel(dayType: string): string {
  return dayType === 'WEEKEND' ? 'Fin de semana' : 'Laborable'
}

function describeOccupancyDelta(delta: number): string {
  const difference = Math.abs(delta)
  if (difference < 0.05) return 'muy cerca de la media de la ciudad'
  return delta > 0 ? 'por encima de la media de Zaragoza' : 'por debajo de la media de Zaragoza'
}

function formatPredictionLabel(value: number | null, capacity: number): string {
  if (value === null || !Number.isFinite(value) || capacity <= 0) return 'Sin prediccion suficiente'
  return `${Math.round(value)} bicis (${formatPercent(value / capacity)})`
}

export const Route = createFileRoute('/estaciones/$stationId')({
  loader: ({ params }) => getPublicStationPageData({ data: params.stationId }),
  head: ({ params }) => {
    const id = params.stationId ?? ''
    const title = `Estación ${id} - DatosBizi`
    const description = `Disponibilidad, ocupacion y patrones de uso de la estacion ${id} de Bizi Zaragoza.`
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${getSiteUrl()}/estaciones/${id}` },
      ],
      link: [{ rel: 'canonical', href: `${getSiteUrl()}/estaciones/${id}` }],
      title,
    }
  },
  component: StationPage,
})

function StationPage() {
  const data = Route.useLoaderData()
  const { stationId } = Route.useParams()

  if (!data) {
    return (
      <PageShell>
        <PublicSectionNav activeItemId="dashboard" className="mt-1" />
        <section className="ui-page-hero">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Ficha de estacion</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--foreground)]">Estacion {stationId}</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">Aun no hay datos suficientes para mostrar esta estacion con confianza.</p>
          <a className="ui-inline-action mt-4" href={appRoutes.seoPage('uso-bizi-por-estacion')}>Ver todas las estaciones</a>
        </section>
      </PageShell>
    )
  }

  const { summary, relatedStations } = data
  const station = summary.station
  const siteUrl = getSiteUrl()
  const occupancyDelta = summary.currentOccupancy - summary.cityAverageOccupancy
  const faqItems = [
    {
      question: 'Cuando suele ser mas facil encontrar bici?',
      answer: data.highOccupancySlots[0]
        ? `${formatDayTypeLabel(String(data.highOccupancySlots[0].dayType))} sobre ${formatHourRange(data.highOccupancySlots[0].hour)}, con una ocupacion media del ${formatPercent(data.highOccupancySlots[0].occupancyAvg)}.`
        : 'Todavia no hay un patron historico suficientemente estable para responderlo con precision.',
    },
    {
      question: 'Cuando suele haber mas huecos para devolver?',
      answer: data.lowOccupancySlots[0]
        ? `${formatDayTypeLabel(String(data.lowOccupancySlots[0].dayType))} sobre ${formatHourRange(data.lowOccupancySlots[0].hour)}, cuando la ocupacion media baja a ${formatPercent(data.lowOccupancySlots[0].occupancyAvg)}.`
        : 'La serie disponible todavia no permite marcar una franja clara con mas anclajes libres.',
    },
    {
      question: 'Esta por encima o por debajo de la media de Zaragoza?',
      answer: `La ocupacion actual esta ${describeOccupancyDelta(occupancyDelta)}: ${formatPercent(summary.currentOccupancy)} frente a ${formatPercent(summary.cityAverageOccupancy)} en la ciudad.`,
    },
  ]
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', name: `${station.name} | DatosBizi`, description: `Ficha publica de ${station.name} con disponibilidad actual y patrones de uso.`, url: `${siteUrl}${appRoutes.stationDetail(station.id)}`, inLanguage: 'es' },
      { '@type': 'FAQPage', mainEntity: faqItems.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) },
    ],
  }
  const breadcrumbs = createRootBreadcrumbs(
    { label: 'Estaciones', href: appRoutes.seoPage('uso-bizi-por-estacion') },
    { label: station.name, href: appRoutes.stationDetail(station.id) }
  )

  return (
    <PageShell>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      <PublicSectionNav activeItemId="dashboard" className="mt-1" />
      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Ficha publica de estacion</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">{station.name}</h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          Disponibilidad actual, ocupacion y contexto de uso de la estacion Bizi {station.id}.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a className="ui-inline-action" href={appRoutes.dashboardStation(station.id)}>Abrir detalle en el dashboard</a>
          {summary.districtSlug ? <a className="ui-inline-action" href={appRoutes.districtDetail(summary.districtSlug)}>Ver barrio</a> : null}
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-4">
        <article className="ui-section-card"><p className="stat-label">Bicis</p><p className="stat-value">{station.bikesAvailable}</p></article>
        <article className="ui-section-card"><p className="stat-label">Huecos</p><p className="stat-value">{station.anchorsFree}</p></article>
        <article className="ui-section-card"><p className="stat-label">Capacidad</p><p className="stat-value">{station.capacity}</p></article>
        <article className="ui-section-card"><p className="stat-label">Ocupacion</p><p className="stat-value">{formatPercent(summary.currentOccupancy)}</p></article>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <article className="ui-section-card lg:col-span-2">
          <h2 className="text-xl font-black text-[var(--foreground)]">Resumen rapido</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
            <p>{station.name} tiene ahora {station.bikesAvailable} bicis y {station.anchorsFree} anclajes libres sobre una capacidad de {station.capacity}.</p>
            <p>Su ocupacion actual esta {describeOccupancyDelta(occupancyDelta)}. Usa esta ficha para una lectura rapida y abre el dashboard si necesitas mapa, alertas o mas detalle.</p>
          </div>
        </article>
        <article className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Prediccion</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="stat-label">30 min</dt><dd className="font-semibold text-[var(--foreground)]">{formatPredictionLabel(data.predictions.next30Minutes, station.capacity)}</dd></div>
            <div><dt className="stat-label">60 min</dt><dd className="font-semibold text-[var(--foreground)]">{formatPredictionLabel(data.predictions.next60Minutes, station.capacity)}</dd></div>
          </dl>
        </article>
      </section>
      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Preguntas frecuentes</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {faqItems.map((item) => (
            <article key={item.question} className="ui-surface-block">
              <p className="text-sm font-semibold text-[var(--foreground)]">{item.question}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
      {(data.highOccupancySlots.length > 0 || data.lowOccupancySlots.length > 0) ? (
        <section className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Patrones horarios</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="ui-surface-block"><p className="text-sm font-semibold text-[var(--foreground)]">Mas facil encontrar bici</p>{data.highOccupancySlots.map((slot) => <p key={`h-${slot.dayType}-${slot.hour}`} className="mt-1 text-[11px] text-[var(--muted)]">{formatDayTypeLabel(String(slot.dayType))} · {formatHourRange(slot.hour)} · {formatPercent(slot.occupancyAvg)}</p>)}</div>
            <div className="ui-surface-block"><p className="text-sm font-semibold text-[var(--foreground)]">Mas facil devolver</p>{data.lowOccupancySlots.map((slot) => <p key={`l-${slot.dayType}-${slot.hour}`} className="mt-1 text-[11px] text-[var(--muted)]">{formatDayTypeLabel(String(slot.dayType))} · {formatHourRange(slot.hour)} · {formatPercent(slot.occupancyAvg)}</p>)}</div>
          </div>
        </section>
      ) : null}
      {relatedStations.length > 0 ? (
        <section className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Estaciones relacionadas</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {relatedStations.map((related) => (
              <a key={related.station.id} className="ui-metric-card block" href={appRoutes.stationDetail(related.station.id)}>
                <p className="font-semibold text-[var(--foreground)]">{related.station.name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{related.station.bikesAvailable} bicis · {related.station.anchorsFree} huecos</p>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  )
}
