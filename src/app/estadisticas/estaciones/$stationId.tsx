import { createFileRoute } from '@tanstack/react-router'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { TrackedLink } from '@/app/_components/TrackedLink';
import { createStationBreadcrumb } from '@/lib/breadcrumbs'
import { formatHourRange, formatPercent } from '@/lib/format'
import { appRoutes } from '@/lib/routes'
import { getSiteUrl } from '@/lib/site'
import { getPublicStationPageData } from '@/server-functions/seo-details'
import { PageShell } from '@/components/layout/page-shell'
import { StationFavoriteButton } from '@/app/estadisticas/estaciones/_components/StationFavoriteButton'
import { StationDetailSkeleton } from '@/app/estadisticas/estaciones/_components/StationDetailSkeleton'

function formatDayTypeLabel(dayType: string): string {
  return dayType === 'WEEKEND' ? 'Fin de semana' : 'Laborable'
}

function describeOccupancyDelta(delta: number): string {
  const difference = Math.abs(delta)
  if (difference < 0.05) return 'muy cerca de la media de la ciudad'
  return delta > 0 ? 'por encima de la media de Zaragoza' : 'por debajo de la media de Zaragoza'
}

function formatPredictionLabel(value: number | null, capacity: number): string {
  if (value === null || !Number.isFinite(value) || capacity <= 0) return 'Sin predicción suficiente'
  return `${Math.round(value)} bicis (${formatPercent(value / capacity)})`
}

export const Route = createFileRoute('/estadisticas/estaciones/$stationId')({
  loader: ({ params }) => getPublicStationPageData({ data: params.stationId }),
  pendingComponent: StationDetailSkeleton,
  head: ({ params }) => {
    const id = params.stationId ?? ''
    const title = `Estación ${id} - DatosBizi`
    const description = `Disponibilidad, ocupación y patrones de uso de la estación ${id} de Bizi Zaragoza.`
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${getSiteUrl()}/estadisticas/estaciones/${id}` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      link: [{ rel: 'canonical', href: `${getSiteUrl()}/estadisticas/estaciones/${id}` }],
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
        <section className="ui-page-hero">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Ficha de estación</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--foreground)]">Estación {stationId}</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">Aún no hay datos suficientes para mostrar esta estación con confianza.</p>
          <TrackedLink className="ui-inline-action mt-4" href={appRoutes.statsEstaciones()} ctaEvent={{ source: 'station_empty', ctaId: 'back_to_stations', destination: 'stats_estaciones', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }}>Ver todas las estaciones</TrackedLink>
        </section>
      </PageShell>
    )
  }

  const { summary, relatedStations } = data
  const station = summary.station
  const siteUrl = getSiteUrl()
  const occupancyDelta = summary.currentOccupancy - summary.cityAverageOccupancy
  const next30Point = data.predictions.predictions.find(p => p.horizonMinutes === 30)
  const next60Point = data.predictions.predictions.find(p => p.horizonMinutes === 60)
  const next30 = next30Point?.predictedBikesAvailable ?? null
  const next60 = next60Point?.predictedBikesAvailable ?? null
  const next30Anchors = next30Point?.predictedAnchorsFree ?? null
  const actionableMessage = station.bikesAvailable <= 0
    ? `${station.name} está vacía ahora. No encontrarás bicis disponibles.`
    : station.anchorsFree <= 0
      ? `${station.name} está llena ahora. No podrás dejar bicicleta.`
      : (next30 !== null && next30 >= station.capacity * 0.5)
        ? `${station.name} tiene ${station.bikesAvailable} bicis y ${station.anchorsFree} huecos libres. Buena opción ahora.`
        : `${station.name} tiene ${station.bikesAvailable} bicis y ${station.anchorsFree} huecos libres.`
  const predictionAdvice = (() => {
    if (next30 === null || station.capacity <= 0) return null
    const occupancy = next30 / station.capacity
    if (next30Anchors !== null && next30Anchors / station.capacity < 0.2) return 'Puede llenarse pronto. Busca una alternativa si necesitas dejar bici.'
    if (occupancy < 0.2) return 'Puede quedarse vacía pronto. Busca una alternativa si necesitas coger bici.'
    return 'Se espera que siga disponible la próxima hora.'
  })()
  const faqItems = [
    {
      question: '¿Cuándo suele ser más fácil encontrar bici?',
      answer: data.highOccupancySlots[0]
        ? `${formatDayTypeLabel(String(data.highOccupancySlots[0].dayType))} sobre ${formatHourRange(data.highOccupancySlots[0].hour)}, con una ocupación media del ${formatPercent(data.highOccupancySlots[0].occupancyAvg)}.`
        : 'Todavía no hay un patrón histórico suficientemente estable para responderlo con precisión.',
    },
    {
      question: '¿Cuándo suele haber más huecos para devolver?',
      answer: data.lowOccupancySlots[0]
        ? `${formatDayTypeLabel(String(data.lowOccupancySlots[0].dayType))} sobre ${formatHourRange(data.lowOccupancySlots[0].hour)}, cuando la ocupación media baja a ${formatPercent(data.lowOccupancySlots[0].occupancyAvg)}.`
        : 'La serie disponible todavía no permite marcar una franja clara con más anclajes libres.',
    },
    {
      question: '¿Está por encima o por debajo de la media de Zaragoza?',
      answer: `La ocupación actual está ${describeOccupancyDelta(occupancyDelta)}: ${formatPercent(summary.currentOccupancy)} frente a ${formatPercent(summary.cityAverageOccupancy)} en la ciudad.`,
    },
  ]
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', name: `${station.name} | DatosBizi`, description: `Ficha pública de ${station.name} con disponibilidad actual y patrones de uso.`, url: `${siteUrl}/estadisticas/estaciones/${station.id}`, inLanguage: 'es' },
      { '@type': 'FAQPage', mainEntity: faqItems.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) },
    ],
  }
  const breadcrumbs = createStationBreadcrumb(station.name)

  return (
    <PageShell>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Ficha pública de estación</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">{station.name}</h1>
        <div className="mt-3 flex items-center gap-3">
          <StationFavoriteButton stationId={station.id} />
        </div>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          Disponibilidad actual, ocupación y contexto de uso de la estación Bizi {station.id}.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <TrackedLink className="ui-inline-action" href={appRoutes.dashboardStation(station.id)} ctaEvent={{ source: 'station_detail', ctaId: 'open_dashboard', destination: 'dashboard_station', entityType: 'station', sourceRole: 'hub', destinationRole: 'dashboard', transitionKind: 'to_dashboard' }}>Ver en mapa avanzado</TrackedLink>
          {summary.districtSlug ? <TrackedLink className="ui-inline-action" href={appRoutes.districtDetail(summary.districtSlug)} ctaEvent={{ source: 'station_detail', ctaId: 'view_district', destination: summary.districtSlug, sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }}>Ver barrio</TrackedLink> : null}
        </div>
      </header>
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <article className="ui-section-card"><p className="stat-label">Bicis</p><p className="stat-value">{station.bikesAvailable}</p></article>
        <article className="ui-section-card"><p className="stat-label">Huecos</p><p className="stat-value">{station.anchorsFree}</p></article>
        <article className="ui-section-card"><p className="stat-label">Capacidad</p><p className="stat-value">{station.capacity}</p></article>
        <article className="ui-section-card"><p className="stat-label">Ocupacion</p><p className="stat-value">{formatPercent(summary.currentOccupancy)}</p></article>
      </section>
      {station.bikesAvailable <= 0 ? (
        <p className="mt-4 text-sm text-[var(--danger)]">
          ⚠️ Esta estación está vacía ahora. No encontrarás bicis disponibles.
        </p>
      ) : station.anchorsFree <= 0 ? (
        <p className="mt-4 text-sm text-[var(--primary)]">
          ⚠️ Esta estación está llena ahora. No podrás dejar bicicleta.
        </p>
      ) : (
        <p className="mt-4 text-sm text-[var(--success)]">
          ✅ Buena opción: {station.bikesAvailable} bicis y {station.anchorsFree} huecos libres.
        </p>
      )}
      <section className="grid gap-4 lg:grid-cols-3">
        <article className="ui-section-card lg:col-span-2">
          <h2 className="text-xl font-black text-[var(--foreground)]">Resumen rapido</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
            <p>{actionableMessage}</p>
            <p>Su ocupación actual está {describeOccupancyDelta(occupancyDelta)}. Usa esta ficha para una lectura rápida y abre el mapa avanzado si necesitas mapa, alertas o más detalle.</p>
          </div>
        </article>
        <article className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Prediccion</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="stat-label">30 min</dt><dd className="font-semibold text-[var(--foreground)]">{formatPredictionLabel(next30, station.capacity)}</dd></div>
            <div><dt className="stat-label">60 min</dt><dd className="font-semibold text-[var(--foreground)]">{formatPredictionLabel(next60, station.capacity)}</dd></div>
          </dl>
          {predictionAdvice ? (
            <p className={`mt-2 text-xs ${predictionAdvice === 'Se espera que siga disponible la próxima hora.' ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
              {predictionAdvice}
            </p>
          ) : null}
        </article>
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
          <h2 className="text-xl font-black text-[var(--foreground)]">Alternativas cercanas</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Si esta estación no te sirve, estas son opciones cercanas:</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {relatedStations.map((related) => (
              <TrackedLink key={related.station.id} className="ui-metric-card block" href={appRoutes.stationDetail(related.station.id)} entitySelectEvent={{ source: 'station_alternatives', entityType: 'station', module: related.station.id }}>
                <p className="font-semibold text-[var(--foreground)]">{related.station.name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{related.station.bikesAvailable} bicis · {related.station.anchorsFree} huecos</p>
              </TrackedLink>
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  )
}
