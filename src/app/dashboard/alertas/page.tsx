import type { Metadata } from 'next';
import { fetchStations } from '@/lib/api';
import { buildPageMetadata } from '@/lib/seo';
import { AlertsHistoryClient } from './_components/AlertsHistoryClient';

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: 'Historial de alertas',
  description:
    'Consulta alertas activas y resueltas de Bizi Zaragoza para detectar estaciones vacias, llenas o con riesgo operativo.',
  path: '/dashboard/alertas',
});

export default async function DashboardAlertsHistoryPage() {
  const stations = await fetchStations().catch(() => ({
    stations: [],
    generatedAt: new Date().toISOString(),
  }));

  return <AlertsHistoryClient stations={stations.stations} />;
}
