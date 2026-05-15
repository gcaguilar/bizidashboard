import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';
import { getSiteUrl } from '@/lib/site';

export const Route = createFileRoute('/viajes-por-dia-zaragoza')({
  loader: () => fetchSeoLandingData({ data: { slug: 'viajes-por-dia-zaragoza' } }),
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Viajes por día en Zaragoza - DatosBizi'
    const description = 'Analiza los viajes por día en el sistema Bizi Zaragoza. Patrones semanales, diferencia entre laborables y fines de semana.'
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/viajes-por-dia-zaragoza` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/viajes-por-dia-zaragoza` }],
      title,
    }
  },
  component: ViajesPorDiaZaragozaPage,
});

function ViajesPorDiaZaragozaPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="viajes-por-dia-zaragoza"
      config={config}
      content={content}
      indexability={indexability}
    />
  );
}
