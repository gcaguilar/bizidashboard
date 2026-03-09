import type { Metadata } from 'next';
import { fetchStations } from '@/lib/api';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site';
import { AlertsHistoryClient } from './_components/AlertsHistoryClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Historial de alertas',
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/dashboard/alertas',
  },
  openGraph: {
    title: `${SITE_TITLE} - Historial de alertas`,
    description: SITE_DESCRIPTION,
    url: '/dashboard/alertas',
  },
};

export default async function DashboardAlertsHistoryPage() {
  const stations = await fetchStations().catch(() => ({
    stations: [],
    generatedAt: new Date().toISOString(),
  }));

  return <AlertsHistoryClient stations={stations.stations} />;
}
