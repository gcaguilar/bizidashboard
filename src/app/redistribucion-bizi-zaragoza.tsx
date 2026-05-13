import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';

export const Route = createFileRoute('/redistribucion-bizi-zaragoza')({
  loader: () => fetchSeoLandingData({ data: { slug: 'redistribucion-bizi-zaragoza' } }),
  component: RedistribucionBiziZaragozaPage,
});

function RedistribucionBiziZaragozaPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="redistribucion-bizi-zaragoza"
      config={config}
      content={content}
      indexability={indexability}
    />
  );
}
