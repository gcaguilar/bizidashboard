import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';

export const Route = createFileRoute('/barrios-bizi-zaragoza')({
  loader: () => fetchSeoLandingData({ data: { slug: 'barrios-bizi-zaragoza' } }),
  component: BarriosBiziZaragozaPage,
});

function BarriosBiziZaragozaPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SeoLandingPageComponent
        slug="barrios-bizi-zaragoza"
        config={config}
        content={content}
        indexability={indexability}
      />
    </Suspense>
  );
}
