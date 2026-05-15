import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';
import { getSiteUrl } from '@/lib/site';

export const Route = createFileRoute('/estaciones-con-mas-bicis')({
  loader: () => fetchSeoLandingData({ data: { slug: 'estaciones-con-mas-bicis' } }),
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Estaciones con más bicis en Zaragoza - DatosBizi'
    const description = 'Ranking de estaciones Bizi Zaragoza con más bicicletas disponibles. Descubre dónde encontrar más bicis.'
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/estaciones-con-mas-bicis` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/estaciones-con-mas-bicis` }],
      title,
    }
  },
  component: EstacionesConMasBicisPage,
});

function EstacionesConMasBicisPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="estaciones-con-mas-bicis"
      config={config}
      content={content}
      indexability={indexability}
    />
  );
}
