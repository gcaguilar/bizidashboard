import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';
import { getSiteUrl } from '@/lib/site';

export const Route = createFileRoute('/redistribucion')({
  loader: () => fetchSeoLandingData({ data: { slug: 'redistribucion' } }),
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Redistribución de Bizi en Zaragoza - DatosBizi'
    const description = 'Analiza la redistribución de bicicletas Bizi Zaragoza. Patrones de reequilibrio y recomendaciones operativas.'
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/redistribucion` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/redistribucion` }],
      title,
    }
  },
  component: RedistribucionBiziZaragozaPage,
});

function RedistribucionBiziZaragozaPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="redistribucion"
      config={config}
      content={content}
      indexability={indexability}
    />
  );
}
