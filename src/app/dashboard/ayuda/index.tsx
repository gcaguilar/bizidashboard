import { createFileRoute } from '@tanstack/react-router'
import { HelpCenterClient } from '@/app/dashboard/ayuda/_components/HelpCenterClient';
import { getDashboardHelpPageData } from '@/server-functions/dashboard-ayuda';

export const Route = createFileRoute('/dashboard/ayuda/')({
  head: () => {
    const title = 'Centro de ayuda - Dashboard Bizi'
    const description = 'FAQ del dashboard de Bizi Zaragoza para entender alertas, rankings, movilidad, predicciones y metodologia de calculo.'
    return {
      meta: [
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
  loader: () => getDashboardHelpPageData(),
  component: DashboardHelpPage,
});

export default function DashboardHelpPage() {
  const { historyMeta } = Route.useLoaderData();
  return <HelpCenterClient historyMeta={historyMeta} />;
}
