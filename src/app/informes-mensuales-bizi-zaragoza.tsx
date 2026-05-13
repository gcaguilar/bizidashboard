import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';

export const Route = createFileRoute('/informes-mensuales-bizi-zaragoza')({
  loader: () => fetchSeoLandingData({ data: { slug: 'informes-mensuales-bizi-zaragoza' } }),
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
