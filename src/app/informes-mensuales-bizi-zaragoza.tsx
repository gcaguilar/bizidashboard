import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';
import { getSiteUrl } from '@/lib/site';

export const Route = createFileRoute('/informes-mensuales-bizi-zaragoza')({
  loader: () => fetchSeoLandingData({ data: { slug: 'informes-mensuales-bizi-zaragoza' } }),
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Informes mensuales de Bizi Zaragoza - DatosBizi'
    const description = 'Archivo de informes mensuales del sistema Bizi Zaragoza. Análisis detallado de demanda, estaciones y movilidad.'
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/informes-mensuales-bizi-zaragoza` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/informes-mensuales-bizi-zaragoza` }],
      title,
    }
  },
  component: InformesMensualesBiziZaragozaPage,
});

function InformesMensualesBiziZaragozaPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="informes-mensuales-bizi-zaragoza"
      config={config}
      content={content}
      indexability={indexability}
    />
  );
}
