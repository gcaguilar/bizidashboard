import { createFileRoute } from '@tanstack/react-router';
import { SeoLandingPageComponent } from '@/app/_seo/SeoLandingPageComponent';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';

export const Route = createFileRoute('/ranking-estaciones-bizi')({
  loader: () => fetchSeoLandingData({ data: { slug: 'ranking-estaciones-bizi' } }),
  component: RankingEstacionesBiziPage,
});

function RankingEstacionesBiziPage() {
  const { config, content, indexability } = Route.useLoaderData();
  return (
    <SeoLandingPageComponent
      slug="ranking-estaciones-bizi"
      config={config}
      content={content}
      indexability={indexability}
    />
  );
}
