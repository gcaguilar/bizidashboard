import type { Metadata } from 'next';
import { fetchStations } from '@/lib/api';
import { buildPageMetadata } from '@/lib/seo';
import { StationsDirectoryClient } from './_components/StationsDirectoryClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Estaciones',
  description:
    'Explora todas las estaciones de Bizi Zaragoza y entra al detalle de disponibilidad, patrones horarios y comparativas.',
  path: '/dashboard/estaciones',
});

export default async function StationsDirectoryPage() {
  const stations = await fetchStations().catch(() => ({
    stations: [],
    generatedAt: new Date().toISOString(),
  }));

  return <StationsDirectoryClient stations={stations.stations} />;
}
