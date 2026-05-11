import { createFileRoute } from '@tanstack/react-router'
import { fetchStations } from '@/lib/api';
import { appRoutes } from '@/lib/routes';
import { buildFallbackStations } from '@/lib/shared-data-fallbacks';
import { StationsDirectoryClient } from '@/app/dashboard/estaciones/_components/StationsDirectoryClient';

export const Route = createFileRoute('/dashboard/estaciones')({
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
  loader: async () => {
    const stations = await fetchStations().catch(() =>
      buildFallbackStations(new Date().toISOString())
    );
    return { stations };
  },
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
