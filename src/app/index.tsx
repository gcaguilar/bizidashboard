import { Link, createFileRoute } from '@tanstack/react-router';
import { PageShell } from '@/components/layout/page-shell';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
import { HomeFavoritesSection } from '@/app/_components/HomeFavoritesSection';
import { HomeExploreSection } from '@/app/_components/HomeExploreSection';
import { useHasFavorites } from '@/app/_components/HomeFavoritesClient';
import { appRoutes } from '@/lib/routes';
import { getSiteUrl, SEO_SITE_TITLE, SEO_SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import { formatPercent, formatInteger } from '@/lib/format';
import { getHomePageData } from '@/server-functions/home';

const HOME_FAQ = [
  {
    question: 'Como saber si hay bicis disponibles en mi estacion mas cercana?',
    answer: 'Usa el mapa en vivo o busca el nombre de la estacion en el buscador global. Cada ficha muestra bicis disponibles, huecos libres y ocupacion en tiempo real.',
  },
  {
    question: 'Que estaciones tienen mas bicis ahora mismo?',
    answer: 'En la pagina de estadisticas de estaciones puedes filtrar por "Con bicis" para ver solo las que tienen disponibilidad, ordenadas de mayor a menor.',
  },
  {
    question: 'Cada cuanto se actualizan los datos?',
    answer: 'Los datos se actualizan cada pocos minutos desde el feed oficial de Bizi Zaragoza. La hora exacta de la ultima actualizacion aparece en la parte superior de la pagina.',
  },
] as const;

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
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
    title: SEO_SITE_TITLE,
  }),
  loader: () => getHomePageData(),
  component: Home,
});

function Home() {
  const { mostUsedStations, problemStations, stationRows, bikesAvailable, activeStationsCount, generatedAt } = Route.useLoaderData();
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
          <a href={appRoutes.statsMapa()} className="ui-primary-button">
            Ver mapa en vivo
          </a>
          <a href={appRoutes.statsEstaciones()} className="ui-inline-action">
            Buscar estación
          </a>
        </div>

        <PublicSearchForm />
      </header>

      <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
        <span className="ui-chip">{formatInteger(bikesAvailable)} bicis disponibles</span>
        <span className="ui-chip">{formatInteger(activeStationsCount)} estaciones activas</span>
        <span className="ui-chip">Actualizado {new Date(generatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      {!hasFavorites && (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-lg">💡</span>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Marca tus estaciones favoritas
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Desde el{' '}
                <Link to={appRoutes.dashboard()} className="underline hover:text-[var(--foreground)]">
                  dashboard
                </Link>{' '}
                puedes marcar tus estaciones habituales como favoritas. Aparecerán aquí cada vez que entres, con su estado actual y alertas si están vacías o llenas.
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hasFavorites && (
          <div className="xl:col-span-2">
            <HomeFavoritesSection stationRows={stationRows} />
          </div>
        )}

        <div className="ui-section-card">
          <p className="stat-label">Estaciones más usadas</p>
          <div className="mt-2 space-y-2">
            {mostUsedStations.map((s) => (
              <a
                key={s.station.id}
                href={appRoutes.stationDetail(s.station.id)}
                className="ui-surface-block ui-surface-block-interactive"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">{s.station.name}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                  <span>{formatInteger(Number(s.turnover?.turnoverScore ?? 0))} puntos de actividad</span>
                  <span>{formatInteger(s.station.bikesAvailable)} bicis ahora</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="ui-section-card">
          <p className="stat-label">Estaciones con más problemas</p>
          <div className="mt-2 space-y-2">
            {problemStations.map((s) => {
              const problemHours = Number(s.availability?.emptyHours ?? 0) + Number(s.availability?.fullHours ?? 0);
              return (
                <a
                  key={s.station.id}
                  href={appRoutes.stationDetail(s.station.id)}
                  className="ui-surface-block ui-surface-block-interactive"
                >
                  <p className="text-sm font-semibold text-[var(--foreground)]">{s.station.name}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                    <span>{formatInteger(problemHours)} h con problemas</span>
                    <span>{formatPercent(s.currentOccupancy)} nivel de uso</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {!hasFavorites && <HomeFavoritesSection stationRows={stationRows} />}
      </section>

<HomeExploreSection />
    </PageShell>
  );
}