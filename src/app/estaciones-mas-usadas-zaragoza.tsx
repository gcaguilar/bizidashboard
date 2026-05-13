import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';

export const Route = createFileRoute('/estaciones-mas-usadas-zaragoza')({
  loader: () => fetchSeoLandingData({ data: { slug: 'estaciones-mas-usadas-zaragoza' } }),
  component: EstacionesMasUsadasPage,
});

function EstacionesMasUsadasPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="estaciones-mas-usadas-zaragoza"
      config={config}
      content={content}
      indexability={indexability}
    />
  );
}
