import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { StatsSecondaryNav } from '@/app/estadisticas/_components/StatsSecondaryNav';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';
import { getSiteUrl } from '@/lib/site';

export const Route = createFileRoute('/estadisticas/barrios/')({
  loader: () => fetchSeoLandingData({ data: { slug: 'barrios-bizi-zaragoza' } }),
  head: () => {
    const siteUrl = getSiteUrl();
    const title = 'Barrios Bizi Zaragoza - DatosBizi';
    const description = 'Compara barrios de Zaragoza por estaciones Bizi, actividad y disponibilidad.';
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/estadisticas/barrios` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      ],
      link: [{ rel: 'canonical', href: `${siteUrl}/estadisticas/barrios` }],
      title,
    };
  },
  component: EstadisticasBarriosPage,
});

function EstadisticasBarriosPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="barrios-bizi-zaragoza"
      config={config}
      content={content}
      indexability={indexability}
      navOverride={<StatsSecondaryNav />}
    />
  );
}
