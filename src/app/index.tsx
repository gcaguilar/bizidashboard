import { createFileRoute } from '@tanstack/react-router';
import { PageShell } from '@/components/layout/page-shell';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
import { HomeFavoritesSection } from '@/app/_components/HomeFavoritesSection';
import { HomeExploreSection } from '@/app/_components/HomeExploreSection';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { useHasFavorites } from '@/app/_components/HomeFavoritesClient';
import { appRoutes } from '@/lib/routes';
import { getSiteUrl, SEO_SITE_TITLE, SEO_SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import { formatPercent, formatInteger, formatHourMinute } from '@/lib/format';
import { getHomePageData } from '@/server-functions/home';

export const HOME_CACHE_CONTROL =
  'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600';

const HOME_FAQ = [
  {
    question: '¿Cómo saber si hay bicis disponibles en mi estación más cercana?',
    answer: 'Usa el mapa avanzado o busca el nombre de la estación. Cada ficha muestra bicis disponibles, huecos libres y ocupación reciente.',
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
  const { mostUsedStations, problemStations, stationRows, bikesAvailable, activeStationsCount, generatedAt } = Route.useLoaderData();
  const generatedAtLabel = formatHourMinute(generatedAt);
  const hasFavorites = useHasFavorites();

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
              Datos públicos de Bizi
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-5xl">
              Bizi Zaragoza ahora mismo
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Disponibilidad en tiempo real, las estaciones más usadas y acceso rápido a todo lo que necesitas.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <TrackedLink
            href={appRoutes.advancedMap()}
            ctaEvent={{ source: 'home_hero', ctaId: 'open_map', destination: 'stats_map', sourceRole: 'home', destinationRole: 'hub', transitionKind: 'within_public' }}
            className="ui-primary-button w-full sm:w-auto"
          >
            Abrir mapa avanzado
          </TrackedLink>
          <TrackedLink
            href={appRoutes.statsEstaciones()}
            ctaEvent={{ source: 'home_hero', ctaId: 'browse_stations', destination: 'stats_estaciones', sourceRole: 'home', destinationRole: 'hub', transitionKind: 'within_public' }}
            className="ui-inline-action w-full sm:w-auto"
          >
            Buscar estación
          </TrackedLink>
        </div>

        <PublicSearchForm />
      </header>

      <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
        <span className="ui-chip">{formatInteger(bikesAvailable)} bicis disponibles</span>
        <span className="ui-chip">{formatInteger(activeStationsCount)} estaciones activas</span>
        <span className="ui-chip" suppressHydrationWarning>Actualizado {generatedAtLabel}</span>
      </div>

      <div
        className="mt-4 rounded-xl border border-[var(--warning)]/20 bg-[var(--warning)]/8 px-4 py-3"
        style={{ display: hasFavorites ? 'none' : undefined }}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-lg">💡</span>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Marca tus estaciones favoritas
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Desde el{' '}
              <TrackedLink href={appRoutes.dashboard()} className="underline hover:text-[var(--foreground)]">
                mapa avanzado
              </TrackedLink>{' '}
              puedes marcar tus estaciones habituales como favoritas. Se guardan solo en este navegador y aparecerán aquí con su estado actual.
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2" style={{ display: hasFavorites ? undefined : 'none' }}>
          <HomeFavoritesSection stationRows={stationRows} />
        </div>

        <div className="ui-section-card">
          <p className="stat-label">Estaciones más usadas</p>
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
          <p className="stat-label">Estaciones con más problemas</p>
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
                    <span>{formatPercent(s.currentOccupancy)} nivel de uso</span>
                  </div>
                </TrackedLink>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-2" style={{ display: hasFavorites ? 'none' : undefined }}>
          <HomeFavoritesSection stationRows={stationRows} />
        </div>
      </section>

<HomeExploreSection />
    </PageShell>
  );
}
