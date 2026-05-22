import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { StatsSecondaryNav } from '@/app/estadisticas/_components/StatsSecondaryNav';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';
import { getSiteUrl } from '@/lib/site';

export const Route = createFileRoute('/estadisticas/redistribucion')({
  loader: () => fetchSeoLandingData({ data: { slug: 'redistribucion' } }),
  head: () => {
    const siteUrl = getSiteUrl();
    const title = 'Redistribución Bizi Zaragoza - DatosBizi';
    const description = 'Diagnóstico de reequilibrio y estaciones que necesitan atención en Bizi Zaragoza.';
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/estadisticas/redistribucion` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      ],
      link: [{ rel: 'canonical', href: `${siteUrl}/estadisticas/redistribucion` }],
      title,
    };
  },
  component: EstadisticasRedistribucionPage,
});

function EstadisticasRedistribucionPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="redistribucion"
      config={config}
      content={content}
      indexability={indexability}
      navOverride={<StatsSecondaryNav />}
    />
  );
}
