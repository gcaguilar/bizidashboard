import { createFileRoute } from '@tanstack/react-router';
import { StatsSecondaryNav } from '@/app/estadisticas/_components/StatsSecondaryNav';
import { StationsDirectory } from '@/app/estadisticas/estaciones/_components/StationsDirectory';
import { StationsSkeleton } from '@/app/estadisticas/estaciones/_components/StationsSkeleton';
import { getSiteUrl } from '@/lib/site';
import { getStationsDirectoryData } from '@/server-functions/estaciones';

export const Route = createFileRoute('/estadisticas/estaciones/')({
  loader: () => getStationsDirectoryData(),
  pendingComponent: StationsSkeleton,
  head: () => {
    const siteUrl = getSiteUrl();
    const title = 'Estaciones Bizi Zaragoza - DatosBizi';
    const description = 'Ranking y disponibilidad de estaciones Bizi Zaragoza. Consulta las más usadas con datos actualizados.';
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/estadisticas/estaciones` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      ],
      link: [{ rel: 'canonical', href: `${siteUrl}/estadisticas/estaciones` }],
      title,
    };
  },
  component: EstadisticasEstacionesPage,
});

function EstadisticasEstacionesPage() {
  const stationRows = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <StatsSecondaryNav />
      </div>
      <StationsDirectory stationRows={stationRows} />
    </div>
  );
}
