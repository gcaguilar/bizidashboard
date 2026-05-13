import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';

export const Route = createFileRoute('/uso-bizi-por-estacion')({
  loader: () => fetchSeoLandingData({ data: { slug: 'uso-bizi-por-estacion' } }),
  component: UsoBiziPorEstacionPage,
});

function UsoBiziPorEstacionPage() {
  const data = Route.useLoaderData();
  const { config, content, indexability } = data ?? {};
  if (!config) {
    return <div>Error: config is undefined. Data keys: {data ? Object.keys(data).join(', ') : 'no data'}</div>;
  }
  return (
    <SeoLandingPageComponent
      slug="uso-bizi-por-estacion"
      config={config}
      content={content}
      indexability={indexability}
    />
  );
}
