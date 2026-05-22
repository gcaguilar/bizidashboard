import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { StatsSecondaryNav } from '@/app/estadisticas/_components/StatsSecondaryNav';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';
import { getSiteUrl } from '@/lib/site';

export const Route = createFileRoute('/estadisticas/viajes')({
  loader: () => fetchSeoLandingData({ data: { slug: 'viajes-por-mes-zaragoza' } }),
  head: () => {
    const siteUrl = getSiteUrl();
    const title = 'Viajes Bizi Zaragoza - DatosBizi';
    const description = 'Tendencia diaria y mensual de viajes estimados en el sistema Bizi Zaragoza.';
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/estadisticas/viajes` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      ],
      link: [{ rel: 'canonical', href: `${siteUrl}/estadisticas/viajes` }],
      title,
    };
  },
  component: EstadisticasViajesPage,
});

function EstadisticasViajesPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="viajes-por-mes-zaragoza"
      config={config}
      content={content}
      indexability={indexability}
      navOverride={<StatsSecondaryNav />}
    />
  );
}
