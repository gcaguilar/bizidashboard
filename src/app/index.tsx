import { createFileRoute } from '@tanstack/react-router';
import { PageShell } from '@/components/layout/page-shell';
import { HomeExploreSection } from '@/app/_components/HomeExploreSection';
import { HomeLiveSection } from '@/app/_components/home/HomeLiveSection';
import { NearbyBikesCta } from '@/app/_components/home/NearbyBikesCta';
import { HomeStatusHero } from '@/app/_components/HomeStatusHero';
import { NetworkBriefingViewTracker } from '@/app/dashboard/_components/NetworkBriefingViewTracker';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { appRoutes } from '@/lib/routes';
import { buildLocaleAlternates, localizedUrl, ogLocale } from '@/lib/i18n/seo';
import { translate } from '@/lib/i18n/messages';
import { useT } from '@/lib/i18n/use-locale';
import type { Locale } from '@/lib/i18n/locales';
import {
  DEFAULT_SOCIAL_IMAGE_HEIGHT,
  DEFAULT_SOCIAL_IMAGE_PATH,
  DEFAULT_SOCIAL_IMAGE_WIDTH,
  getCityName,
  getSiteUrl,
  SEO_SITE_NAME,
  SEO_HOME_TITLE,
  SEO_HOME_DESCRIPTION,
} from '@/lib/site';
import { getHomePageData } from '@/server-functions/home';
import { toJsonLdScript } from '@/lib/structured-data';

export const HOME_CACHE_CONTROL =
  'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600';

function getHomeFaq(locale: Locale) {
  const params = { city: getCityName() };
  return [
    {
      question: translate(locale, 'home.faq.nearest.question', params),
      answer: translate(locale, 'home.faq.nearest.answer', params),
    },
    {
      question: translate(locale, 'home.faq.mostBikes.question', params),
      answer: translate(locale, 'home.faq.mostBikes.answer', params),
    },
    {
      question: translate(locale, 'home.faq.updates.question', params),
      answer: translate(locale, 'home.faq.updates.answer', params),
    },
  ];
}

/** Título y descripción SEO: en español siguen viniendo de `site.ts`. */
function getHomeSeoCopy(locale: Locale) {
  return locale === 'es'
    ? { title: SEO_HOME_TITLE, description: SEO_HOME_DESCRIPTION }
    : {
        title: translate(locale, 'home.seo.title', { city: getCityName() }),
        description: translate(locale, 'home.seo.description', { city: getCityName() }),
      };
}

/** La home en español mantiene su canonical sin barra final. */
function getHomeUrl(locale: Locale): string {
  return locale === 'es' ? getSiteUrl() : localizedUrl('/', locale);
}

export const Route = createFileRoute('/')({
  headers: () => ({
    'Cache-Control': HOME_CACHE_CONTROL,
  }),
  head: ({ match }) => {
    const locale = match.context.locale;
    const { title, description } = getHomeSeoCopy(locale);
    const url = getHomeUrl(locale);
    return {
      meta: [
        { title },
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: SEO_SITE_NAME },
        { property: 'og:locale', content: ogLocale(locale) },
        { property: 'og:image', content: `${getSiteUrl()}${DEFAULT_SOCIAL_IMAGE_PATH}` },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: String(DEFAULT_SOCIAL_IMAGE_WIDTH) },
        { property: 'og:image:height', content: String(DEFAULT_SOCIAL_IMAGE_HEIGHT) },
        { property: 'og:image:alt', content: `${SEO_SITE_NAME} · Bizi Zaragoza` },
        { property: 'og:url', content: url },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: `${getSiteUrl()}${DEFAULT_SOCIAL_IMAGE_PATH}` },
        { name: 'twitter:image:alt', content: `${SEO_SITE_NAME} · Bizi Zaragoza` },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [
        { rel: 'canonical', href: url },
        ...buildLocaleAlternates('/').map((link) =>
          link.hreflang === 'en' ? link : { ...link, href: getSiteUrl() },
        ),
      ],
    };
  },
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
  const { locale, t } = useT();
  const cityParams = { city: getCityName() };
  const HOME_FAQ = getHomeFaq(locale);
  const seoCopy = getHomeSeoCopy(locale);

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
                name: seoCopy.title,
                description: seoCopy.description,
                url: getHomeUrl(locale),
                inLanguage: locale,
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
              {t('home.hero.eyebrow', cityParams)}
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-5xl">
              {t('home.hero.title', cityParams)}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              {t('home.hero.subtitle')}
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
              {t('home.hero.networkStatus')}
            </TrackedLink>
            {' · '}
            <TrackedLink
              href={appRoutes.reports()}
              ctaEvent={{ source: 'home_hero', ctaId: 'open_reports', destination: 'reports', sourceRole: 'home', destinationRole: 'hub', transitionKind: 'within_public' }}
              className="underline underline-offset-2 hover:text-[var(--foreground)]"
            >
              {t('home.hero.monthlyReports')}
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
        <h2 id="home-faq-title" className="text-xl font-black text-[var(--foreground)]">{t('home.faq.title')}</h2>
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
