import { createFileRoute } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes'
import { buildSeoHead } from '@/lib/seo-head'
import { PageShell } from '@/components/layout/page-shell';
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
  return (
    <PageShell>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <header className="max-w-3xl space-y-3">
          <p className="stat-label">Directorio público</p>
          <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] md:text-4xl">
            Estaciones Bizi Zaragoza
          </h1>
          <p className="text-base text-[var(--muted)] md:text-lg">
            Ranking y disponibilidad actual de estaciones, con filtros para encontrar bicis, huecos y puntos con más actividad.
          </p>
        </header>
        <StationsDirectory stationRows={stationRows} />
      </div>
    </PageShell>
  );
}
