import { createFileRoute } from '@tanstack/react-router';
import { buildSeoHead } from '@/lib/seo-head'
import { z } from 'zod';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { CompareHubContent } from '@/app/comparar/_components/CompareHubContent';
import { appRoutes } from '@/lib/routes';
import { PageShell } from '@/components/layout/page-shell';
import { getCompareHubLoaderData } from '@/server-functions/comparar';
import { ObservatoryEventTracker } from '@/app/_components/ObservatoryEventTracker';

export const Route = createFileRoute('/comparar')({
  ssr: 'data-only',
  validateSearch: z.object({
    dimension: z.string().optional(),
    left: z.string().optional(),
    right: z.string().optional(),
  }),
  head: () =>
    buildSeoHead({
      title: 'Comparador',
      socialTitle: 'Comparador - DatosBizi',
      description: 'Compara estaciones, barrios, meses y patrones de uso para detectar cambios de demanda, rankings y equilibrio en Bizi Zaragoza.',
      path: appRoutes.compare(),
    }),
  loader: () => getCompareHubLoaderData(),
  errorComponent: CompareErrorPage,
  component: ComparePage,
});

function CompareErrorPage() {
  return (
    <PageShell>
      <ObservatoryEventTracker name="comparison_validated_viewed" source="comparison_hub" routeKey="compare" />
      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Comparador no disponible</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
          No se pudo cargar el comparador
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          Vuelve a intentarlo en unos minutos o revisa el estado general de cobertura.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <TrackedLink href={appRoutes.status()} className="ui-primary-button">Ver estado</TrackedLink>
          <TrackedLink href={appRoutes.explore()} className="ui-inline-action">Ir a explorar</TrackedLink>
        </div>
      </header>
    </PageShell>
  );
}

export default function ComparePage() {
  const { breadcrumbs, structuredData, comparisonData } = Route.useLoaderData();
  const search = Route.useSearch();
  const initialQuery = {
    dimensionId: search.dimension ?? null,
    leftId: search.left ?? null,
    rightId: search.right ?? null,
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <header className="ui-page-hero">
        <SiteBreadcrumbs items={breadcrumbs} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Comparar datos
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Comparador
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Cruza estaciones, barrios, meses, horas y periodos para entender que cambia,
              donde hay mas demanda y que zonas necesitan mas seguimiento.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-wrap gap-3">
            <TrackedLink href={appRoutes.dashboardView('research')}
              className="ui-primary-button"
            >
              Abrir análisis en el mapa avanzado
            </TrackedLink>
            <TrackedLink href={appRoutes.explore()}
              className="ui-inline-action"
            >
              Volver al hub Explorar
            </TrackedLink>
          </div>
          <PublicSearchForm />
        </div>
      </header>

      <CompareHubContent initialQuery={initialQuery} data={comparisonData} />
    </PageShell>
  );
}
