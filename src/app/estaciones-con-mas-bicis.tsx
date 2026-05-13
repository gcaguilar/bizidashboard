import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';

export const Route = createFileRoute('/estaciones-con-mas-bicis')({
  loader: () => fetchSeoLandingData({ data: { slug: 'estaciones-con-mas-bicis' } }),
  component: EstacionesConMasBicisPage,
});

function EstacionesConMasBicisPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="estaciones-con-mas-bicis"
      config={config}
      content={content}
      indexability={indexability}
    />
  );
}
