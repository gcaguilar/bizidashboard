import { createFileRoute } from '@tanstack/react-router';
import { PageShell } from '@/components/layout/page-shell';
import { HomeExploreSection } from '@/app/_components/HomeExploreSection';
import { NetworkBriefing } from '@/app/dashboard/_components/NetworkBriefing';
import { NetworkBriefingViewTracker } from '@/app/dashboard/_components/NetworkBriefingViewTracker';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { appRoutes } from '@/lib/routes';
import { getSiteUrl, SEO_SITE_TITLE, SEO_SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import { formatPercent, formatInteger, formatHourMinute } from '@/lib/format';
import { buildObservatoryEvent } from '@/lib/umami';
import { getHomePageData } from '@/server-functions/home';

export const HOME_CACHE_CONTROL =
  'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600';

const HOME_FAQ = [
  {
    question: '¿Cómo saber si hay bicis disponibles en mi estación más cercana?',
    answer: 'Usa BiciRadar, el producto de consulta individual y proximidad. Este observatorio resume el rendimiento y la evolución de toda la red.',
  },
  {
    question: '¿Qué estaciones tienen más bicis ahora mismo?',
    answer: 'En la página de estadísticas de estaciones puedes filtrar por "Con bicis" para ver solo las que tienen disponibilidad, ordenadas de mayor a menor.',
  },
  {
    question: '¿Cada cuánto se actualizan los datos?',
    answer: 'Los datos se actualizan cada pocos minutos desde el feed oficial de Bizi Zaragoza. La página de estado muestra la última muestra válida.',
  },
] as const;

export const Route = createFileRoute('/')({
  headers: () => ({
    'Cache-Control': HOME_CACHE_CONTROL,
  }),
  head: () => ({
    meta: [
      { title: SEO_SITE_TITLE },
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: SEO_SITE_DESCRIPTION },
      { property: 'og:title', content: SEO_SITE_TITLE },
      { property: 'og:description', content: SEO_SITE_DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: getSiteUrl() },
      { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: SEO_SITE_TITLE },
      { name: 'twitter:description', content: SEO_SITE_DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: getSiteUrl() }],
  }),
  loader: () => getHomePageData(),
  component: Home,
});

function Home() {
  const { mostUsedStations, problemStations, bikesAvailable, activeStationsCount, generatedAt, briefing } = Route.useLoaderData();
  const generatedAtLabel = formatHourMinute(generatedAt);

  return (
    <PageShell>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebPage',
                name: SEO_SITE_TITLE,
                description: SEO_SITE_DESCRIPTION,
                url: getSiteUrl(),
                inLanguage: 'es',
                isAccessibleForFree: true,
                publisher: {
                  '@type': 'Organization',
                  name: SITE_NAME,
                  url: getSiteUrl(),
                },
              },
              {
                '@type': 'FAQPage',
                mainEntity: HOME_FAQ.map((item) => ({
                  '@type': 'Question',
                  name: item.question,
                  acceptedAnswer: { '@type': 'Answer', text: item.answer },
                })),
              },
            ],
          }),
        }}
      />
      <header className="ui-page-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Observatorio público de movilidad
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-5xl">
              Cómo evoluciona y se equilibra Bizi Zaragoza
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Lee el rendimiento de la red, las señales de tensión, su evolución y la calidad de los datos públicos.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <TrackedLink
            href={appRoutes.dashboard()}
            ctaEvent={{ source: 'home_hero', ctaId: 'open_network_summary', destination: 'dashboard', sourceRole: 'home', destinationRole: 'hub', transitionKind: 'within_public' }}
            className="ui-primary-button w-full sm:w-auto"
          >
            Ver resumen de red
          </TrackedLink>
          <TrackedLink
            href={appRoutes.reports()}
            ctaEvent={{ source: 'home_hero', ctaId: 'open_reports', destination: 'reports', sourceRole: 'home', destinationRole: 'hub', transitionKind: 'within_public' }}
            className="ui-inline-action w-full sm:w-auto"
          >
            Ver evolución e informes
          </TrackedLink>
        </div>

      </header>

      <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
        <span className="ui-chip">{formatInteger(bikesAvailable)} bicis disponibles</span>
        <span className="ui-chip">{formatInteger(activeStationsCount)} estaciones activas</span>
        <span className="ui-chip" suppressHydrationWarning>Actualizado {generatedAtLabel}</span>
      </div>

      <NetworkBriefing briefing={briefing} className="mt-4" />
      <NetworkBriefingViewTracker />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="ui-section-card">
          <p className="stat-label">Estaciones a vigilar</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Señales de fricción observadas en la cobertura disponible.</p>
          <div className="mt-2 space-y-2">
            {problemStations.map((s) => {
              const problemHours = Number(s.availability?.emptyHours ?? 0) + Number(s.availability?.fullHours ?? 0);
              return (
                <TrackedLink
                  key={s.station.id}
                  href={appRoutes.stationDetail(s.station.id)}
                  entitySelectEvent={{ source: 'home_problem', entityType: 'station', module: s.station.id }}
                  className="ui-surface-block ui-surface-block-interactive"
                >
                  <p className="text-sm font-semibold text-[var(--foreground)]">{s.station.name}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                    <span>{formatInteger(problemHours)} h con problemas</span>
                    <span>{formatPercent(s.currentOccupancy)} ocupación</span>
                  </div>
                </TrackedLink>
              );
            })}
          </div>
        </div>

        <div className="ui-section-card">
          <p className="stat-label">Actividad estimada por estación</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Puntos de actividad derivados; no son viajes oficiales.</p>
          <div className="mt-2 space-y-2">
            {mostUsedStations.map((s) => (
              <TrackedLink
                key={s.station.id}
                href={appRoutes.stationDetail(s.station.id)}
                entitySelectEvent={{ source: 'home_most_used', entityType: 'station', module: s.station.id }}
                className="ui-surface-block ui-surface-block-interactive"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">{s.station.name}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                  <span>{formatInteger(Number(s.turnover?.turnoverScore ?? 0))} puntos de actividad</span>
                  <span>{formatInteger(s.station.bikesAvailable)} bicis ahora</span>
                </div>
              </TrackedLink>
            ))}
          </div>
        </div>

        <div className="ui-section-card">
          <p className="stat-label">Consulta individual</p>
          <h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">¿Buscas una bici o un anclaje cerca?</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">BiciRadar es el producto de proximidad. Usa ubicación y búsqueda de estaciones sin cambiar este observatorio.</p>
          <TrackedLink
            href={appRoutes.biciradar()}
            trackingEvent={buildObservatoryEvent('biciradar_handoff_clicked', { surface: 'public', routeKey: 'home', source: 'home_biciradar_handoff' })}
            className="ui-primary-button mt-4"
          >
            Abrir BiciRadar
          </TrackedLink>
        </div>
      </section>

<HomeExploreSection />
    </PageShell>
  );
}
