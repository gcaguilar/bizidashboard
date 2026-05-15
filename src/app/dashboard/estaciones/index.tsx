import { createFileRoute } from '@tanstack/react-router'
import { StationsDirectoryClient } from '@/app/dashboard/estaciones/_components/StationsDirectoryClient';
import { getStationsDirectoryPageData } from '@/server-functions/dashboard-estaciones';
import { getSiteUrl } from '@/lib/site';

export const Route = createFileRoute('/dashboard/estaciones/')({
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Estaciones - Dashboard Bizi'
    const description = 'Explora todas las estaciones de Bizi Zaragoza y entra al detalle de disponibilidad, patrones horarios y comparativas.'
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/dashboard/estaciones` },
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/dashboard/estaciones` }],
      title,
    }
  },
  loader: () => getStationsDirectoryPageData(),
  component: StationsDirectoryPage,
});

export default function StationsDirectoryPage() {
  const { stations } = Route.useLoaderData();
  return (
    <StationsDirectoryClient
      stations={stations.stations}
      dataState={stations.dataState}
    />
  );
}
