import { createFileRoute } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes'
import { buildSeoHead } from '@/lib/seo-head'
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { toAbsoluteRouteUrl } from '@/lib/routes'
import { PageShell } from '@/components/layout/page-shell';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { StationsDirectory } from '@/app/estadisticas/estaciones/_components/StationsDirectory';
import { StationsSkeleton } from '@/app/estadisticas/estaciones/_components/StationsSkeleton';
import { getStationsDirectoryData } from '@/server-functions/estaciones';

export const Route = createFileRoute('/estadisticas/estaciones/')({
  loader: () => getStationsDirectoryData(),
  pendingComponent: StationsSkeleton,
  head: () =>
    buildSeoHead({
      title: 'Estaciones Bizi Zaragoza - DatosBizi',
      description: 'Ranking y disponibilidad de estaciones Bizi Zaragoza. Consulta las más usadas con datos actualizados.',
      path: appRoutes.statsEstaciones(),
    }),
  component: EstadisticasEstacionesPage,
});

function EstadisticasEstacionesPage() {
  const stationRows = Route.useLoaderData();
  const canonicalPath = '/estadisticas/estaciones';
  const breadcrumbs = createRootBreadcrumbs({ label: 'Estaciones', href: canonicalPath });
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'CollectionPage',
        name: 'Estaciones Bizi Zaragoza',
        description: 'Ranking y disponibilidad actual de estaciones Bizi Zaragoza.',
        url: toAbsoluteRouteUrl(canonicalPath),
      },
    ],
  };

  return (
    <PageShell>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <header className="max-w-3xl space-y-3">
          <p className="stat-label">Directorio público</p>
          <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] md:text-4xl">
            Estaciones Bizi Zaragoza
          </h1>
          <p className="text-base text-[var(--muted)] md:text-lg">
            Busca una estación y filtra por bicis, huecos, disponibilidad o movimiento estimado. Así podrás encontrar una opción útil ahora o analizar la red con más calma.
          </p>
        </header>
        <StationsDirectory stationRows={stationRows} />
      </div>
    </PageShell>
  );
}
