import type { Metadata } from 'next';
import { fetchStations } from '@/lib/api';
import { appRoutes } from '@/lib/routes';
import { buildPageMetadata } from '@/lib/seo';
import { buildFallbackStations } from '@/lib/shared-data-fallbacks';
import { StationsDirectoryClient } from './_components/StationsDirectoryClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Estaciones',
  description:
    'Explora todas las estaciones de Bizi Zaragoza y entra al detalle de disponibilidad, patrones horarios y comparativas.',
  path: appRoutes.dashboardStations(),
});

export default async function StationsDirectoryPage() {
  const stations = await fetchStations().catch(() =>
    buildFallbackStations(new Date().toISOString())
  );

  return (
    <StationsDirectoryClient
      stations={stations.stations}
      dataState={stations.dataState}
    />
  );
}
