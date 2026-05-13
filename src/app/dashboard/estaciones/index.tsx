import { createFileRoute } from '@tanstack/react-router'
import { StationsDirectoryClient } from '@/app/dashboard/estaciones/_components/StationsDirectoryClient';
import { getStationsDirectoryPageData } from '@/server-functions/dashboard-estaciones';

export const Route = createFileRoute('/dashboard/estaciones/')({
  head: () => ({
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'description',
        content:
          'Explora todas las estaciones de Bizi Zaragoza y entra al detalle de disponibilidad, patrones horarios y comparativas.',
      },
      { property: 'og:type', content: 'website' },
    ],
    title: 'Estaciones',
  }),
  loader: () => getStationsDirectoryPageData(),
  component: StationsDirectoryPage,
});

export default function StationsDirectoryPage() {
  const { stations } = Route.useLoaderData();
  return (
    <StationsDirectoryClient
      stations={stations.stations}
      dataState={stations.dataState}
    />
  );
}
