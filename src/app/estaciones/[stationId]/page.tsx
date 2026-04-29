import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { appRoutes } from '@/lib/routes';
import { buildPageMetadata } from '@/lib/seo';
import { getStationSeoPageData } from '@/lib/seo-stations';
import { buildSocialImagePath } from '@/lib/social-images';
import { getSiteUrl, SEO_SITE_NAME } from '@/lib/site';
import { formatDecimal, formatHourRange, formatPercent } from '@/lib/format';
import { PageShell } from '@/components/layout/page-shell';

export const revalidate = 300;

type PageProps = {
  params: Promise<{ stationId: string }>;
};

function formatDayTypeLabel(dayType: string): string {
  return dayType === 'WEEKEND' ? 'Fin de semana' : 'Laborable';
}

function describeOccupancyDelta(delta: number): string {
  const difference = Math.abs(delta);

  if (difference < 0.05) {
    return 'muy cerca de la media de la ciudad';
  }

  return delta > 0
    ? 'por encima de la media de Zaragoza'
    : 'por debajo de la media de Zaragoza';
}

function formatPredictionLabel(value: number | null, capacity: number): string {
  if (value === null || !Number.isFinite(value) || capacity <= 0) {
    return 'Sin predicción suficiente';
  }

  return `${Math.round(value)} bicis (${formatPercent(value / capacity)})`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { stationId } = await params;
  const stationData = await getStationSeoPageData(stationId);

  if (!stationData) {
    return buildPageMetadata({
      title: 'Estacion Bizi Zaragoza',
      description:
        'Ficha publica de estacion sin cobertura suficiente para publicar una landing indexable.',
      path: appRoutes.stationDetail(stationId),
      indexability: {
        pageType: 'station',
        hasMeaningfulContent: true,
        hasData: false,
        requiresStrongCoverage: true,
      },
    });
  }

  const { summary } = stationData;

  return buildPageMetadata({
    title: `${summary.station.name}: uso, disponibilidad y patrones Bizi Zaragoza`,
    description: `Ficha publica de ${summary.station.name} con disponibilidad actual, franjas horarias, comparativa con Zaragoza y enlaces relacionados por barrio.`,
    path: appRoutes.stationDetail(summary.station.id),
    keywords: [
      summary.station.name,
      `estacion bizi ${summary.station.id}`,
      `bicis ${summary.districtName ?? 'zaragoza'}`,
      'bizi zaragoza estaciones',
    ],
    socialImagePath: buildSocialImagePath({
      kind: 'station',
      title: summary.station.name,
      subtitle: `${summary.station.bikesAvailable} bicis · ${summary.station.anchorsFree} anclajes libres · ${summary.districtName ?? 'Zaragoza'}`,
      eyebrow: 'Ficha publica por estacion',
      badges: [
        `${summary.station.bikesAvailable} bicis`,
        `ocupacion ${formatPercent(summary.currentOccupancy)}`,
      ],
    }),
    indexability: summary.indexabilityInput,
  });
}

export default async function PublicStationPage({ params }: PageProps) {
  const { stationId } = await params;
  const stationData = await getStationSeoPageData(stationId);

  if (!stationData) {
    notFound();
  }

  const { summary, predictions, relatedStations, highOccupancySlots, lowOccupancySlots } =
    stationData;
  const station = summary.station;
  const districtLabel = summary.districtName ?? 'Zaragoza';
  const occupancyDelta = summary.currentOccupancy - summary.cityAverageOccupancy;
  const siteUrl = getSiteUrl();
  const signalHours = Math.max(
    Number(summary.turnover?.totalHours ?? 0),
    Number(summary.availability?.totalHours ?? 0)
  );
  const breadcrumbs = createRootBreadcrumbs(
    {
      label: 'Estaciones Bizi Zaragoza',
      href: appRoutes.seoPage('uso-bizi-por-estacion'),
    },
    {
      label: station.name,
      href: appRoutes.stationDetail(station.id),
    }
  );
  const faqItems = [
    {
      question: '¿Cuándo suele ser más fácil encontrar bici?',
      answer: highOccupancySlots[0]
        ? `${formatDayTypeLabel(String(highOccupancySlots[0].dayType))} sobre ${formatHourRange(highOccupancySlots[0].hour)}, con una ocupación media del ${formatPercent(highOccupancySlots[0].occupancyAvg)}.`
        : 'Todavía no hay un patrón histórico suficientemente estable para responderlo con precisión.',
    },
    {
      question: '¿Cuándo suele haber más huecos para devolver?',
      answer: lowOccupancySlots[0]
        ? `${formatDayTypeLabel(String(lowOccupancySlots[0].dayType))} sobre ${formatHourRange(lowOccupancySlots[0].hour)}, cuando la ocupación media baja a ${formatPercent(lowOccupancySlots[0].occupancyAvg)}.`
        : 'La serie disponible todavía no permite marcar una franja clara con más anclajes libres.',
    },
    {
      question: '¿Está por encima o por debajo de la media de Zaragoza?',
      answer: `La ocupación actual está ${describeOccupancyDelta(occupancyDelta)}: ${formatPercent(summary.currentOccupancy)} frente a ${formatPercent(summary.cityAverageOccupancy)} en la ciudad.`,
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'WebPage',
        name: `${station.name} | ${SEO_SITE_NAME}`,
        description: `Ficha publica de ${station.name} con disponibilidad actual y patrones de uso.`,
        url: `${siteUrl}${appRoutes.stationDetail(station.id)}`,
        inLanguage: 'es',
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <PageShell>
      <PublicPageViewTracker
        pageType="station"
        template="station_detail"
        pageSlug={station.id}
        entityId={station.id}
      />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="ui-page-hero">
        <SiteBreadcrumbs items={breadcrumbs} />
        <PublicSectionNav activeItemId="explore" className="mt-1" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Ficha publica por estacion
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              {station.name}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Esta ficha resume el estado actual y la señal histórica de la estación en {districtLabel}.
              Ahora mismo tiene {station.bikesAvailable} bicis y {station.anchorsFree} anclajes libres sobre{' '}
              {station.capacity} plazas, con una ocupación {describeOccupancyDelta(occupancyDelta)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="ui-chip">Distrito {districtLabel}</span>
            <span className="ui-chip">Ocupación {formatPercent(summary.currentOccupancy)}</span>
            <span className="ui-chip">{signalHours} horas históricas útiles</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <TrackedLink
            href={appRoutes.dashboardStation(station.id)}
            navigationEvent={{
              source: 'public_station_hero',
              destination: 'dashboard_station',
              sourceRole: 'hub',
              destinationRole: 'dashboard',
              transitionKind: 'to_dashboard',
            }}
            className="inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
          >
            Abrir detalle operativo
          </TrackedLink>
          {summary.districtSlug ? (
            <TrackedLink
              href={appRoutes.districtDetail(summary.districtSlug)}
              navigationEvent={{
                source: 'public_station_hero',
                destination: 'district_detail',
                sourceRole: 'hub',
                destinationRole: 'hub',
                transitionKind: 'within_public',
              }}
              className="ui-inline-action"
            >
              Ver barrio relacionado
            </TrackedLink>
          ) : null}
          <TrackedLink
            href={appRoutes.seoPage('ranking-estaciones-bizi')}
            navigationEvent={{
              source: 'public_station_hero',
              destination: 'station_ranking',
              sourceRole: 'hub',
              destinationRole: 'entry_seo',
              transitionKind: 'within_public',
            }}
            className="ui-inline-action"
          >
            Abrir ranking de estaciones
          </TrackedLink>
        </div>
      </header>

      <section className="ui-section-card">
        <div className="max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Como interpretar esta estacion
            </p>
            <h2 className="text-xl font-black leading-tight text-[var(--foreground)]">
              Lectura util para disponibilidad y contexto real
            </h2>
          </div>
          <p>
            La ficha combina dos capas distintas. La primera es el snapshot actual, que te dice cuántas
            bicicletas y anclajes libres hay ahora mismo. La segunda es la serie histórica reciente, que
            muestra si esta estación suele mantenerse equilibrada o si entra con frecuencia en zonas de
            vaciado o saturación.
          </p>
          <p>
            En {station.name}, la rotación reciente es de {formatDecimal(summary.turnover?.turnoverScore ?? null)} puntos
            y acumula {formatDecimal(summary.availability?.problemHours ?? null)} horas de fricción entre vaciarse
            y llenarse. Eso ayuda a saber si conviene abrir el detalle operativo, revisar el barrio o usar esta
            estación como referencia para compararla con otras cercanas.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="ui-section-card">
          <p className="stat-label">Bicis disponibles</p>
          <p className="stat-value">{station.bikesAvailable}</p>
          <p className="text-xs text-[var(--muted)]">Lectura actual del snapshot público.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Anclajes libres</p>
          <p className="stat-value">{station.anchorsFree}</p>
          <p className="text-xs text-[var(--muted)]">Huecos disponibles para devolver bici.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Rotación estimada</p>
          <p className="stat-value">{formatDecimal(summary.turnover?.turnoverScore ?? null)}</p>
          <p className="text-xs text-[var(--muted)]">Índice reciente de uso relativo frente al resto de estaciones.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Fricción operativa</p>
          <p className="stat-value">{formatDecimal(summary.availability?.problemHours ?? null)} h</p>
          <p className="text-xs text-[var(--muted)]">Horas con mayor riesgo de vaciado o saturación.</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Cuándo suele haber más bicis</h2>
          <div className="mt-2 space-y-3">
            {highOccupancySlots.length > 0 ? (
              highOccupancySlots.map((slot) => (
                <div
                  key={`${slot.dayType}-${slot.hour}-high`}
                  className="ui-surface-block"
                >
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {formatDayTypeLabel(String(slot.dayType))} · {formatHourRange(slot.hour)}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    Ocupación media {formatPercent(slot.occupancyAvg)} con {slot.sampleCount} muestras.
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Todavía no hay patrón suficiente para señalar franjas estables con más bicis.
              </p>
            )}
          </div>
        </article>

        <article className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Cuándo suele haber más huecos</h2>
          <div className="mt-2 space-y-3">
            {lowOccupancySlots.length > 0 ? (
              lowOccupancySlots.map((slot) => (
                <div
                  key={`${slot.dayType}-${slot.hour}-low`}
                  className="ui-surface-block"
                >
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {formatDayTypeLabel(String(slot.dayType))} · {formatHourRange(slot.hour)}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    Ocupación media {formatPercent(slot.occupancyAvg)} con {slot.sampleCount} muestras.
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Todavía no hay patrón suficiente para señalar franjas con mayor probabilidad de huecos.
              </p>
            )}
          </div>
        </article>

        <article className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Predicción próxima</h2>
          <div className="mt-2 space-y-3">
            {predictions.predictions.map((point) => (
              <div
                key={point.horizonMinutes}
                className="ui-surface-block"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  En {point.horizonMinutes} minutos
                </p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  {formatPredictionLabel(point.predictedBikesAvailable, station.capacity)}
                </p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  Confianza {formatPercent(point.confidence)}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="ui-section-card xl:col-span-2">
          <h2 className="text-xl font-black text-[var(--foreground)]">FAQ basada en datos visibles</h2>
          <div className="mt-2 grid gap-3 md:grid-cols-3">
            <article className="ui-surface-block">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                ¿Cuándo suele ser más fácil encontrar bici?
              </p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{faqItems[0].answer}</p>
            </article>
            <article className="ui-surface-block">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                ¿Cuándo suele haber más huecos para devolver?
              </p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{faqItems[1].answer}</p>
            </article>
            <article className="ui-surface-block">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                ¿Está por encima o por debajo de la media de Zaragoza?
              </p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{faqItems[2].answer}</p>
            </article>
          </div>
        </article>

        <article className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Explora más</h2>
          <div className="mt-2 space-y-3">
            {summary.districtSlug ? (
              <TrackedLink
                href={appRoutes.districtDetail(summary.districtSlug)}
                navigationEvent={{
                  source: 'public_station_related',
                  destination: 'district_detail',
                  sourceRole: 'hub',
                  destinationRole: 'hub',
                  transitionKind: 'within_public',
                }}
                className="block ui-surface-block ui-surface-block-interactive"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">Más datos del barrio</p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  Contexto de {districtLabel} con estaciones destacadas y comparación frente a Zaragoza.
                </p>
              </TrackedLink>
            ) : null}
            <TrackedLink
              href={appRoutes.reports()}
              ctaEvent={{
                source: 'public_station_related',
                ctaId: 'report_open',
                destination: 'report_archive',
                entityType: 'report',
                sourceRole: 'hub',
                destinationRole: 'hub',
                transitionKind: 'within_public',
              }}
              className="block ui-surface-block ui-surface-block-interactive"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">Archivo mensual</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Informes mensuales indexables con contexto histórico y enlaces a estaciones relevantes.
              </p>
            </TrackedLink>
            <TrackedLink
              href={appRoutes.seoPage('estaciones-mas-usadas-zaragoza')}
              navigationEvent={{
                source: 'public_station_related',
                destination: 'seo_ranking',
                sourceRole: 'hub',
                destinationRole: 'entry_seo',
                transitionKind: 'within_public',
              }}
              className="block ui-surface-block ui-surface-block-interactive"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">Ranking y análisis</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Consulta otras estaciones líderes y cómo cambia la demanda reciente en la ciudad.
              </p>
            </TrackedLink>
          </div>
        </article>
      </section>

      {relatedStations.length > 0 ? (
        <section className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">
            Estaciones relacionadas en {districtLabel}
          </h2>
          <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {relatedStations.map((related) => (
              <TrackedLink
                key={related.station.id}
                href={appRoutes.stationDetail(related.station.id)}
                entitySelectEvent={{
                  source: 'public_station_related_stations',
                  entityType: 'station',
                }}
                className="ui-surface-block ui-surface-block-interactive"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">{related.station.name}</p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  {related.station.bikesAvailable} bicis · rotación {formatDecimal(related.turnover?.turnoverScore ?? null)}
                </p>
              </TrackedLink>
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
