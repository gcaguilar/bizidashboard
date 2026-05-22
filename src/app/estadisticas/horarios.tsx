import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { StatsSecondaryNav } from '@/app/estadisticas/_components/StatsSecondaryNav';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';
import { getSiteUrl } from '@/lib/site';

export const Route = createFileRoute('/estadisticas/horarios')({
  loader: () => fetchSeoLandingData({ data: { slug: 'uso-bizi-por-hora' } }),
  head: () => {
    const siteUrl = getSiteUrl();
    const title = 'Uso de Bizi por hora en Zaragoza - DatosBizi';
    const description = 'Horas pico, franjas de mayor actividad y comportamiento del sistema Bizi Zaragoza.';
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/estadisticas/horarios` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      ],
      link: [{ rel: 'canonical', href: `${siteUrl}/estadisticas/horarios` }],
      title,
    };
  },
  component: EstadisticasHorariosPage,
});

function EstadisticasHorariosPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="uso-bizi-por-hora"
      config={config}
      content={content}
      indexability={indexability}
      navOverride={<StatsSecondaryNav />}
    />
  );
}
