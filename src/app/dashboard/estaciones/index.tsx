import { createFileRoute } from '@tanstack/react-router'
import { appRoutes } from '@/lib/routes'
import { buildSeoHead } from '@/lib/seo-head'
import { StationsDirectoryClient } from '@/app/dashboard/estaciones/_components/StationsDirectoryClient';
import { getStationsDirectoryPageData } from '@/server-functions/dashboard-estaciones';

export const Route = createFileRoute('/dashboard/estaciones/')({
  head: () =>
    buildSeoHead({
      title: 'Estaciones - Dashboard Bizi',
      description: 'Explora todas las estaciones de Bizi Zaragoza y entra al detalle de disponibilidad, patrones horarios y comparativas.',
      path: appRoutes.dashboardStations(),
      robots: 'noindex, nofollow',
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
