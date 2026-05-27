import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod';
import { AlertsHistoryClient } from '@/app/dashboard/alertas/_components/AlertsHistoryClient';
import { getAlertsHistoryPageData } from '@/server-functions/dashboard-alertas';

export const Route = createFileRoute('/dashboard/alertas/')({
  validateSearch: z.object({
    stationId: z.string().optional(),
    alertType: z.enum(['all', 'LOW_BIKES', 'LOW_ANCHORS']).optional(),
    state: z.enum(['all', 'active', 'resolved']).optional(),
    severity: z.enum(['all', '1', '2']).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.string().optional(),
  }),
  head: () => {
    const title = 'Historial de alertas - Dashboard Bizi'
    const description = 'Consulta alertas activas y resueltas de Bizi Zaragoza para detectar estaciones sin bicis, sin huecos o que necesitan revision.'
    return {
      meta: [
        { title },
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      title,
    }
  },
  loader: () => getAlertsHistoryPageData(),
  component: DashboardAlertsHistoryPage,
});

export default function DashboardAlertsHistoryPage() {
  const { stations } = Route.useLoaderData();
  return <AlertsHistoryClient stations={stations.stations} />;
}
