import type { Metadata } from 'next';
import { fetchStations } from '@/lib/api';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site';
import { StationsDirectoryClient } from './_components/StationsDirectoryClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Estaciones',
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/dashboard/estaciones',
  },
  openGraph: {
    title: `${SITE_TITLE} - Estaciones`,
    description: SITE_DESCRIPTION,
    url: '/dashboard/estaciones',
  },
};

export default async function StationsDirectoryPage() {
  const stations = await fetchStations().catch(() => ({
    stations: [],
    generatedAt: new Date().toISOString(),
  }));

  return <StationsDirectoryClient stations={stations.stations} />;
}
