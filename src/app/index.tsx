import { createFileRoute } from '@tanstack/react-router';
import { PageShell } from '@/components/layout/page-shell';
import { HomeExploreSection } from '@/app/_components/HomeExploreSection';
import { HomeLiveSection } from '@/app/_components/home/HomeLiveSection';
import { NearbyBikesCta } from '@/app/_components/home/NearbyBikesCta';
import { HomeStatusHero } from '@/app/_components/HomeStatusHero';
import { NetworkBriefingViewTracker } from '@/app/dashboard/_components/NetworkBriefingViewTracker';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { appRoutes } from '@/lib/routes';
import {
  DEFAULT_SOCIAL_IMAGE_HEIGHT,
  DEFAULT_SOCIAL_IMAGE_PATH,
  DEFAULT_SOCIAL_IMAGE_WIDTH,
  getSiteUrl,
  SEO_SITE_NAME,
  SEO_HOME_TITLE,
  SEO_HOME_DESCRIPTION,
} from '@/lib/site';
import { getHomePageData } from '@/server-functions/home';
import { toJsonLdScript } from '@/lib/structured-data';

export const HOME_CACHE_CONTROL =
  'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600';

const HOME_FAQ = [
  {
    question: '¿Cómo saber si hay bicis disponibles en mi estación más cercana?',
    answer: 'Abre BiciRadar y consulta las estaciones cercanas: verás al momento cuántas bicis y huecos libres tiene cada una. Este observatorio sirve para entender el estado general y la evolución de toda la red.',
  },
  {
    question: '¿Qué estaciones tienen más bicis ahora mismo?',
    answer: 'En las estadísticas de estaciones, filtra por "Con bicis" para ver las que tienen disponibilidad, ordenadas de mayor a menor.',
  },
  {
    question: '¿Cada cuánto se actualizan los datos?',
    answer: 'Los datos se actualizan cada pocos minutos desde el sistema oficial de Bizi Zaragoza. En Estado de los datos puedes comprobar la hora de la última actualización.',
  },
] as const;

export const Route = createFileRoute('/')({
  headers: () => ({
    'Cache-Control': HOME_CACHE_CONTROL,
  }),
  head: () => ({
    meta: [
      { title: SEO_HOME_TITLE },
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: SEO_HOME_DESCRIPTION },
      { property: 'og:title', content: SEO_HOME_TITLE },
      { property: 'og:description', content: SEO_HOME_DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SEO_SITE_NAME },
      { property: 'og:locale', content: 'es_ES' },
      { property: 'og:image', content: `${getSiteUrl()}${DEFAULT_SOCIAL_IMAGE_PATH}` },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:width', content: String(DEFAULT_SOCIAL_IMAGE_WIDTH) },
      { property: 'og:image:height', content: String(DEFAULT_SOCIAL_IMAGE_HEIGHT) },
      { property: 'og:image:alt', content: `${SEO_SITE_NAME} · Bizi Zaragoza` },
      { property: 'og:url', content: getSiteUrl() },
      { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: `${getSiteUrl()}${DEFAULT_SOCIAL_IMAGE_PATH}` },
      { name: 'twitter:image:alt', content: `${SEO_SITE_NAME} · Bizi Zaragoza` },
      { name: 'twitter:title', content: SEO_HOME_TITLE },
      { name: 'twitter:description', content: SEO_HOME_DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: getSiteUrl() }],
  }),
  loader: () => getHomePageData(),
  component: Home,
});

function Home() {
  const {
    mostUsedStations,
    problemStations,
    bikesAvailable,
    activeStationsCount,
    generatedAt,
    briefing,
    anchorsFreeTotal,
    criticalStationsCount,
    health,
    topCriticalDistricts,
    districts,
  } = Route.useLoaderData();

  return (
    <PageShell>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: toJsonLdScript({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebPage',
                name: SEO_HOME_TITLE,
                description: SEO_HOME_DESCRIPTION,
                url: getSiteUrl(),
                inLanguage: 'es',
                isAccessibleForFree: true,
                publisher: {
                  '@type': 'Organization',
                  name: SEO_SITE_NAME,
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
              Datos públicos de Bizi Zaragoza
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-5xl">
              Entiende cómo está Bizi Zaragoza ahora
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Consulta bicis y huecos disponibles, detecta estaciones con problemas y descubre cómo cambia la red con el tiempo.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
            <NearbyBikesCta />
            <NearbyBikesCta mode="anchors" />
          </div>
          <p className="text-sm text-[var(--muted)]">
            <TrackedLink
              href={appRoutes.dashboard()}
              ctaEvent={{ source: 'home_hero', ctaId: 'open_network_summary', destination: 'dashboard', sourceRole: 'home', destinationRole: 'hub', transitionKind: 'within_public' }}
              className="underline underline-offset-2 hover:text-[var(--foreground)]"
            >
              Ver estado de la red
            </TrackedLink>
            {' · '}
            <TrackedLink
              href={appRoutes.reports()}
              ctaEvent={{ source: 'home_hero', ctaId: 'open_reports', destination: 'reports', sourceRole: 'home', destinationRole: 'hub', transitionKind: 'within_public' }}
              className="underline underline-offset-2 hover:text-[var(--foreground)]"
            >
              Ver informes mensuales
            </TrackedLink>
          </p>
        </div>
      </header>

      <HomeStatusHero
        briefing={briefing}
        health={health}
        bikesAvailable={bikesAvailable}
        anchorsFreeTotal={anchorsFreeTotal}
        activeStationsCount={activeStationsCount}
        criticalStationsCount={criticalStationsCount}
        topCriticalDistricts={topCriticalDistricts}
        generatedAt={generatedAt}
      />
      <NetworkBriefingViewTracker />

      <HomeLiveSection
        stationsTotal={activeStationsCount}
        districts={districts}
        problemStations={problemStations}
        mostUsedStations={mostUsedStations}
      />

      <section className="ui-section-card" aria-labelledby="home-faq-title">
        <h2 id="home-faq-title" className="text-xl font-black text-[var(--foreground)]">Preguntas frecuentes</h2>
        <div className="mt-3 space-y-4">
          {HOME_FAQ.map((item) => (
            <article key={item.question}>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">{item.question}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <HomeExploreSection />
    </PageShell>
  );
}
