import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';
import { getSiteUrl } from '@/lib/site';

export const Route = createFileRoute('/estaciones-mas-usadas-zaragoza')({
  loader: () => fetchSeoLandingData({ data: { slug: 'estaciones-mas-usadas-zaragoza' } }),
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Estaciones más usadas en Zaragoza - DatosBizi'
    const description = 'Ranking de las estaciones Bizi Zaragoza más utilizadas. Descubre los hubs de mayor tráfico del sistema.'
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/estaciones-mas-usadas-zaragoza` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/estaciones-mas-usadas-zaragoza` }],
      title,
    }
  },
  component: EstacionesMasUsadasPage,
});

function EstacionesMasUsadasPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="estaciones-mas-usadas-zaragoza"
      config={config}
      content={content}
      indexability={indexability}
    />
  );
}
