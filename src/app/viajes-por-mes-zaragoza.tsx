import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';

export const Route = createFileRoute('/viajes-por-mes-zaragoza')({
  loader: () => fetchSeoLandingData({ data: { slug: 'viajes-por-mes-zaragoza' } }),
  component: ViajesPorMesZaragozaPage,
});

function ViajesPorMesZaragozaPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="viajes-por-mes-zaragoza"
      config={config}
      content={content}
      indexability={indexability}
    />
  );
}
