import { createFileRoute } from '@tanstack/react-router'
import { HelpCenterClient } from '@/app/dashboard/ayuda/_components/HelpCenterClient';
import { getDashboardHelpPageData } from '@/server-functions/dashboard-ayuda';

export const Route = createFileRoute('/dashboard/ayuda/')({
  head: () => ({
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'description',
        content:
          'FAQ del dashboard de Bizi Zaragoza para entender alertas, rankings, movilidad, predicciones y metodologia de calculo.',
      },
      { property: 'og:type', content: 'website' },
    ],
    title: 'Centro de ayuda',
  }),
  loader: () => getDashboardHelpPageData(),
  component: DashboardHelpPage,
});

export default function DashboardHelpPage() {
  const { historyMeta } = Route.useLoaderData();
  return <HelpCenterClient historyMeta={historyMeta} />;
}
