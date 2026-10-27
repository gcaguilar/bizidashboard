import { StationStatusBadge } from '@/components/ui/station-status';
import { createFileRoute, notFound } from '@tanstack/react-router'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { TrackedLink } from '@/app/_components/TrackedLink';
import { createStationBreadcrumb } from '@/lib/breadcrumbs'
import { ShareButton } from '@/app/_components/ShareButton'
import { buildBreadcrumbStructuredData } from '@/lib/breadcrumbs'
import { formatHourRange, formatPercent } from '@/lib/format'
import { appRoutes } from '@/lib/routes'
import { getSiteUrl, DEFAULT_SOCIAL_IMAGE_HEIGHT, DEFAULT_SOCIAL_IMAGE_WIDTH } from '@/lib/site'
import { getPublicStationPageData } from '@/server-functions/seo-details'
import { PageShell } from '@/components/layout/page-shell'
import { StationFavoriteButton } from '@/components/StationFavoriteButton'
import { StationPredictionCard } from '@/app/estadisticas/estaciones/_components/StationPredictionCard'
import { StationBestTime } from '@/app/estadisticas/estaciones/_components/StationBestTime'
import { StationDistrictComparison } from '@/app/estadisticas/estaciones/_components/StationDistrictComparison'
import { StationDetailSkeleton } from '@/app/estadisticas/estaciones/_components/StationDetailSkeleton'
import { toJsonLdScript } from '@/lib/structured-data';
import { RouteErrorReporter } from '@/lib/route-error-reporting';
import { DayType } from '@/analytics/types';
import { buildLocaleAlternates, buildOgLocaleMeta, localizedUrl, localizeStructuredData } from '@/lib/i18n/seo';
import { translate, type Translator } from '@/lib/i18n/messages';
import { useT } from '@/lib/i18n/use-locale';

function describeOccupancyDelta(delta: number, t: Translator): string {
  const difference = Math.abs(delta)
  if (difference < 0.05) return t('station.occupancy.nearAverage')
  return delta > 0 ? t('station.occupancy.aboveAverage') : t('station.occupancy.belowAverage')
}

function describeDayType(dayType: string | null | undefined, t: Translator): string {
  switch (dayType) {
    case DayType.WEEKDAY:
      return t('station.dayType.weekday')
    case DayType.WEEKEND:
      return t('station.dayType.weekend')
    default:
      return t('station.dayType.unknown')
  }
}

export const Route = createFileRoute('/estadisticas/estaciones/$stationId')({
  // Una estación fuera de catálogo no es un 200 con estado vacío: lanzamos
  // `notFound` para que el SSR responda 404 a crawlers y motores de búsqueda,
  // y `notFoundComponent` conserva la ficha amable para la persona usuaria.
  loader: async ({ params }) => {
    const data = await getPublicStationPageData({ data: params.stationId })
    if (!data) throw notFound()
    return data
  },
  pendingComponent: StationDetailSkeleton,
  notFoundComponent: StationNotFoundPage,
  head: ({ params, loaderData, match }) => {
    const locale = match.context.locale
    const id = params.stationId ?? ''
    const stationPath = appRoutes.stationDetail(id)
    const stationUrl = localizedUrl(stationPath, locale)
    const stationName = loaderData?.summary?.station?.name ?? id
    const stationOgImage = `${getSiteUrl()}${appRoutes.api.ogStation(id)}`
    const title = translate(locale, 'station.seo.title', { name: stationName })
    const description = translate(locale, 'station.seo.description', { name: stationName })
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
        ...buildOgLocaleMeta(stationPath, locale),
        { property: 'og:url', content: stationUrl },
        { property: 'og:image', content: stationOgImage },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: String(DEFAULT_SOCIAL_IMAGE_WIDTH) },
        { property: 'og:image:height', content: String(DEFAULT_SOCIAL_IMAGE_HEIGHT) },
        { property: 'og:image:alt', content: title },
        { name: 'robots', content: loaderData ? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' : 'noindex, follow' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: stationOgImage },
        { name: 'twitter:image:alt', content: title },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: stationUrl }, ...buildLocaleAlternates(stationPath)],
      title,
    }
  },
  errorComponent: StationErrorPage,
  component: StationPage,
})

function StationErrorPage({ error }: { error: unknown }) {
  const { t } = useT()
  return (
    <PageShell>
      <RouteErrorReporter error={error} area="route.stats.station" />
      <section className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{t('station.error.eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--foreground)]">{t('station.error.title')}</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">{t('station.error.body')}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <TrackedLink className="ui-primary-button" href={appRoutes.statsEstaciones()}>{t('station.error.viewStations')}</TrackedLink>
          <TrackedLink className="ui-inline-action" href={appRoutes.status()}>{t('station.error.viewStatus')}</TrackedLink>
        </div>
      </section>
    </PageShell>
  );
}

function StationNotFoundPage() {
  const { stationId } = Route.useParams()
  const { t } = useT()

  return (
    <PageShell>
      <section className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{t('station.notFound.eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--foreground)]">{t('station.notFound.title', { id: stationId })}</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">{t('station.notFound.body')}</p>
        <TrackedLink className="ui-inline-action mt-4" href={appRoutes.statsEstaciones()} ctaEvent={{ source: 'station_empty', ctaId: 'back_to_stations', destination: 'stats_estaciones', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }}>{t('station.notFound.viewAll')}</TrackedLink>
      </section>
    </PageShell>
  )
}

function StationPage() {
  const data = Route.useLoaderData()
  const { locale, t } = useT()

  const { summary, relatedStations } = data
  const station = summary.station
  const occupancyDelta = summary.currentOccupancy - summary.cityAverageOccupancy
  const next30Point = data.predictions.predictions.find(p => p.horizonMinutes === 30)
  const next30 = next30Point?.predictedBikesAvailable ?? null
  const nameParams = { name: station.name, bikes: station.bikesAvailable, anchors: station.anchorsFree }
  const actionableMessage = station.bikesAvailable <= 0
    ? t('station.action.empty', nameParams)
    : station.anchorsFree <= 0
      ? t('station.action.full', nameParams)
      : (next30 !== null && next30 >= station.capacity * 0.5)
        ? t('station.action.good', nameParams)
        : t('station.action.default', nameParams)
  const highSlot = data.highOccupancySlots[0]
  const lowSlot = data.lowOccupancySlots[0]
  const faqItems = [
    {
      question: t('station.faq.easyBike.question'),
      answer: highSlot
        ? t('station.faq.easyBike.answer', { dayType: describeDayType(highSlot.dayType, t), hours: formatHourRange(highSlot.hour), percent: formatPercent(highSlot.occupancyAvg) })
        : t('station.faq.easyBike.none'),
    },
    {
      question: t('station.faq.easyDock.question'),
      answer: lowSlot
        ? t('station.faq.easyDock.answer', { dayType: describeDayType(lowSlot.dayType, t), hours: formatHourRange(lowSlot.hour), percent: formatPercent(lowSlot.occupancyAvg) })
        : t('station.faq.easyDock.none'),
    },
    {
      question: t('station.faq.average.question'),
      answer: t('station.faq.average.answer', { delta: describeOccupancyDelta(occupancyDelta, t), current: formatPercent(summary.currentOccupancy), average: formatPercent(summary.cityAverageOccupancy) }),
    },
  ]
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', name: t('station.ld.name', { name: station.name }), description: t('station.ld.description', { name: station.name }), url: localizedUrl(`/estadisticas/estaciones/${station.id}`, locale), inLanguage: locale },
      { '@type': 'FAQPage', mainEntity: faqItems.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) },
    ],
  }
  const breadcrumbLabels = ['station.breadcrumb.home', 'station.breadcrumb.stats', 'station.breadcrumb.stations'] as const
  const breadcrumbs = createStationBreadcrumb(
    station.name,
    appRoutes.stationDetail(station.id)
  ).map((item, index) => (index < breadcrumbLabels.length ? { ...item, label: t(breadcrumbLabels[index]) } : item))

  return (
    <PageShell>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: toJsonLdScript(
            localizeStructuredData(
              {
                ...structuredData,
                '@graph': [buildBreadcrumbStructuredData(breadcrumbs, locale), ...structuredData['@graph']],
              },
              locale,
            ),
          ),
        }}
      />
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{t('station.hero.eyebrow')}</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">{station.name}</h1>
        <div className="mt-3 flex items-center gap-3">
          <StationFavoriteButton stationId={station.id} />
        </div>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          {t('station.hero.intro')}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <TrackedLink className="ui-inline-action" href={appRoutes.dashboardStation(station.id)} ctaEvent={{ source: 'station_detail', ctaId: 'open_dashboard', destination: 'dashboard_station', entityType: 'station', sourceRole: 'hub', destinationRole: 'dashboard', transitionKind: 'to_dashboard' }}>{t('station.hero.openMap')}</TrackedLink>
          {summary.districtSlug ? <TrackedLink className="ui-inline-action" href={appRoutes.districtDetail(summary.districtSlug)} ctaEvent={{ source: 'station_detail', ctaId: 'view_district', destination: summary.districtSlug, sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }}>{t('station.hero.viewDistrict')}</TrackedLink> : null}
          <ShareButton
            title={station.name}
            url={localizedUrl(appRoutes.stationDetail(station.id), locale)}
            text={t('station.share.text', { name: station.name })}
            source="station_detail"
            locale={locale}
          />
        </div>
      </header>
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <article className="ui-section-card"><p className="stat-label">{t('station.stat.bikes')}</p><p className="stat-value">{station.bikesAvailable}</p></article>
        <article className="ui-section-card"><p className="stat-label">{t('station.stat.anchors')}</p><p className="stat-value">{station.anchorsFree}</p></article>
        <article className="ui-section-card"><p className="stat-label">{t('station.stat.capacity')}</p><p className="stat-value">{station.capacity}</p></article>
        <article className="ui-section-card"><p className="stat-label">{t('station.stat.occupancy')}</p><p className="stat-value">{formatPercent(summary.currentOccupancy)}</p></article>
      </section>
      <StationStatusBadge station={station} className="mt-4" locale={locale} />
      {station.bikesAvailable <= 0 ? (
        <p className="mt-4 text-sm text-[var(--danger)]">
          {t('station.alert.empty')}
        </p>
      ) : station.anchorsFree <= 0 ? (
        <p className="mt-4 text-sm text-[var(--primary)]">
          {t('station.alert.full')}
        </p>
      ) : (
        <p className="mt-4 text-sm text-[var(--success)]">
          {t('station.alert.good', nameParams)}
        </p>
      )}
      <section className="grid gap-4 lg:grid-cols-3">
        <article className="ui-section-card lg:col-span-2">
          <h2 className="text-xl font-black text-[var(--foreground)]">{t('station.summary.title')}</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
            <p>{actionableMessage}</p>
            <p>{t('station.summary.body', { delta: describeOccupancyDelta(occupancyDelta, t) })}</p>
          </div>
        </article>
        <StationPredictionCard predictions={data.predictions} capacity={station.capacity} />
      </section>
      <StationDistrictComparison
        stationMetrics={data.stationMetrics}
        districtName={data.districtName}
        peerMetrics={data.districtPeerMetrics}
      />
      <StationBestTime patterns={data.patterns} peakHours={data.peakHours} />
      {(data.highOccupancySlots.length > 0 || data.lowOccupancySlots.length > 0) ? (
        <section className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">{t('station.slots.title')}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="ui-surface-block"><p className="text-sm font-semibold text-[var(--foreground)]">{t('station.slots.easyBike')}</p>{data.highOccupancySlots.map((slot) => <p key={`h-${slot.dayType}-${slot.hour}`} className="mt-1 text-[11px] text-[var(--muted)]">{describeDayType(slot.dayType, t)} · {formatHourRange(slot.hour)} · {formatPercent(slot.occupancyAvg)}</p>)}</div>
            <div className="ui-surface-block"><p className="text-sm font-semibold text-[var(--foreground)]">{t('station.slots.easyDock')}</p>{data.lowOccupancySlots.map((slot) => <p key={`l-${slot.dayType}-${slot.hour}`} className="mt-1 text-[11px] text-[var(--muted)]">{describeDayType(slot.dayType, t)} · {formatHourRange(slot.hour)} · {formatPercent(slot.occupancyAvg)}</p>)}</div>
          </div>
        </section>
      ) : null}
      {relatedStations.length > 0 ? (
        <section className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">{t('station.related.title')}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{t('station.related.intro')}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {relatedStations.map((related) => (
              <TrackedLink key={related.station.id} className="ui-metric-card block" href={appRoutes.stationDetail(related.station.id)} entitySelectEvent={{ source: 'station_alternatives', entityType: 'station', module: related.station.id }}>
                <p className="font-semibold text-[var(--foreground)]">{related.station.name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{t('station.related.availability', { bikes: related.station.bikesAvailable, anchors: related.station.anchorsFree })}</p>
              </TrackedLink>
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  )
}
