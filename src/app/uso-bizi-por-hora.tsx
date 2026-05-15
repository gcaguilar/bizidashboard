import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';
import { getSiteUrl } from '@/lib/site';

export const Route = createFileRoute('/uso-bizi-por-hora')({
  loader: () => fetchSeoLandingData({ data: { slug: 'uso-bizi-por-hora' } }),
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Uso de Bizi por hora en Zaragoza - DatosBizi'
    const description = 'Analiza el uso del sistema Bizi por franja horaria. Horarios pico, patrones diarios y comportamiento del sistema.'
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/uso-bizi-por-hora` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/uso-bizi-por-hora` }],
      title,
    }
  },
  component: UsoBiziPorHoraPage,
});

function UsoBiziPorHoraPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="uso-bizi-por-hora"
      config={config}
      content={content}
      indexability={indexability}
    />
  );
}
