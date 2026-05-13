import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';

export const Route = createFileRoute('/viajes-por-dia-zaragoza')({
  loader: () => fetchSeoLandingData({ data: { slug: 'viajes-por-dia-zaragoza' } }),
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
