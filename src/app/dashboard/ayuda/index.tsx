import { createFileRoute } from '@tanstack/react-router'
import { buildSeoHead } from '@/lib/seo-head'
import { HelpCenterClient } from '@/app/dashboard/ayuda/_components/HelpCenterClient';
import { getDashboardHelpPageData } from '@/server-functions/dashboard-ayuda';

export const Route = createFileRoute('/dashboard/ayuda/')({
  head: () =>
    buildSeoHead({
      title: 'Centro de ayuda - Dashboard Bizi',
      description: 'Ayuda para entender alertas, rankings, movilidad, predicciones y metodologia del dashboard de Bizi Zaragoza.',
      robots: 'noindex, nofollow',
    }),
  loader: () => getDashboardHelpPageData(),
  component: DashboardHelpPage,
});

export default function DashboardHelpPage() {
  const { historyMeta } = Route.useLoaderData();
  return <HelpCenterClient historyMeta={historyMeta} />;
}
