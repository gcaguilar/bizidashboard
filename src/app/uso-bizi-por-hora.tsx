import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';

export const Route = createFileRoute('/uso-bizi-por-hora')({
  loader: () => fetchSeoLandingData({ data: { slug: 'uso-bizi-por-hora' } }),
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
