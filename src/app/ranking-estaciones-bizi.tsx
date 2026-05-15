import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';
import { getSiteUrl } from '@/lib/site';

export const Route = createFileRoute('/ranking-estaciones-bizi')({
  loader: () => fetchSeoLandingData({ data: { slug: 'ranking-estaciones-bizi' } }),
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Ranking de estaciones Bizi Zaragoza - DatosBizi'
    const description = 'Ranking de estaciones del sistema Bizi Zaragoza. Posiciones, cambios y análisis de estaciones más activas.'
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/ranking-estaciones-bizi` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/ranking-estaciones-bizi` }],
      title,
    }
  },
  component: RankingEstacionesBiziPage,
});

function RankingEstacionesBiziPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="ranking-estaciones-bizi"
      config={config}
      content={content}
      indexability={indexability}
    />
  );
}
