import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';
import { getSiteUrl } from '@/lib/site';

export const Route = createFileRoute('/barrios-bizi-zaragoza')({
  loader: () => fetchSeoLandingData({ data: { slug: 'barrios-bizi-zaragoza' } }),
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Barrios de Bizi Zaragoza - DatosBizi'
    const description = 'Compara los barrios de Zaragoza con datos de Bizi: estaciones, disponibilidad y patrones de uso por zona.'
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/barrios-bizi-zaragoza` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/barrios-bizi-zaragoza` }],
      title,
    }
  },
  component: BarriosBiziZaragozaPage,
});

function BarriosBiziZaragozaPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <Suspense fallback={<div>Cargando barrios...</div>}>
      <SeoLandingPageComponent
        slug="barrios-bizi-zaragoza"
        config={config}
        content={content}
        indexability={indexability}
      />
    </Suspense>
  );
}
