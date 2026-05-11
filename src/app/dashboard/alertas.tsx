import { createFileRoute } from '@tanstack/react-router'
import { fetchStations } from '@/lib/api';
import { appRoutes } from '@/lib/routes';
import { AlertsHistoryClient } from '@/app/dashboard/alertas/_components/AlertsHistoryClient';

export const Route = createFileRoute('/dashboard/alertas')({
  head: () => ({
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'description',
        content:
          'Consulta alertas activas y resueltas de Bizi Zaragoza para detectar estaciones vacias, llenas o con riesgo operativo.',
      },
      { property: 'og:type', content: 'website' },
    ],
    title: 'Historial de alertas',
  }),
  loader: async () => {
    const stations = await fetchStations().catch(() => ({
      stations: [],
      generatedAt: new Date().toISOString(),
    }));
    return { stations };
  },
  component: DashboardAlertsHistoryPage,
});

export default function DashboardAlertsHistoryPage() {
  const { stations } = Route.useLoaderData();
  return <AlertsHistoryClient stations={stations.stations} />;
}
