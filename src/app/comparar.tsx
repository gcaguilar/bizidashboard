import { Link, createFileRoute, useSearch } from '@tanstack/react-router';
import { DataStateNotice } from '@/app/_components/DataStateNotice';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { InteractiveComparePanel } from '@/app/comparar/_components/InteractiveComparePanel';
import { shouldShowDataStateNotice } from '@/lib/data-state';
import { formatDateLabel } from '@/lib/format';
import { formatMonthLabel } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { PageShell } from '@/components/layout/page-shell';
import { getCompareHubLoaderData } from '@/server-functions/comparar';
import { getSiteUrl } from '@/lib/site';



function getFirstSearchParam(
  value: string | string[] | undefined
): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function CompareHubContent({
  initialQuery,
  data,
}: {
  initialQuery: {
    dimensionId?: string | null;
    leftId?: string | null;
    rightId?: string | null;
  };
  data: {
    latestMonth: string | null;
    generatedAt: string;
    dataState: 'no_coverage' | 'loading' | 'live_recent' | 'live_stale' | 'partial_coverage' | 'full_coverage';
    interactive: {
      defaultDimensionId: string | null;
      dimensions: Array<unknown>;
    };
    sections: Array<{
      id: string;
      title: string;
      description: string;
      cards: Array<{
        id: string;
        href: string;
        eyebrow: string;
        title: string;
        summary: string;
        metricA: string;
        metricB: string;
        delta: string;
        note?: string;
      }>;
    }>;
  };
}) {
  const comparisonCount = data.sections.reduce((count, section) => count + section.cards.length, 0);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="ui-section-card">
          <p className="stat-label">Comparativas activas</p>
          <p className="stat-value">{comparisonCount}</p>
          <p className="text-xs text-[var(--muted)]">Comparaciones listas para revisar ahora mismo.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Último mes</p>
          <p className="stat-value">{data.latestMonth ? formatMonthLabel(data.latestMonth) : 'Sin dato'}</p>
          <p className="text-xs text-[var(--muted)]">Mes más reciente disponible para comparar.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Generado</p>
          <p className="stat-value">{formatDateLabel(data.generatedAt)}</p>
          <p className="text-xs text-[var(--muted)]">Momento en que se preparó esta vista.</p>
        </article>
      </section>

      {shouldShowDataStateNotice(data.dataState) ? (
        <DataStateNotice
          state={data.dataState}
          subject="las comparativas del hub"
          description="El comparador usa los mismos datos que el mapa avanzado, los informes y la API. Si hay cobertura parcial o datos antiguos, algunas comparaciones pueden quedar incompletas."
          href={appRoutes.status()}
          actionLabel="Revisar estado"
        />
      ) : null}

      <InteractiveComparePanel data={data.interactive} initialQuery={initialQuery} />

      {data.sections.map((section) => (
        <section key={section.id} className="ui-section-card">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              {section.title}
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">{section.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{section.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {section.cards.map((card) => (
              <Link
                key={card.id}
                to={card.href}
                className="ui-surface-block ui-surface-block-interactive"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  {card.eyebrow}
                </p>
                <h3 className="mt-2 text-lg font-black text-[var(--foreground)]">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{card.summary}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]">
                    {card.metricA}
                  </p>
                  <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]">
                    {card.metricB}
                  </p>
                </div>
                <p className="mt-3 text-sm font-bold text-[var(--primary)]">{card.delta}</p>
                {card.note ? (
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{card.note}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

export const Route = createFileRoute('/comparar')({
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Comparador'
    return {
      meta: [
        { title },
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Compara estaciones, barrios, meses y patrones de uso para detectar cambios de demanda, rankings y equilibrio en Bizi Zaragoza.',
        },
        { property: 'og:title', content: 'Comparador - DatosBizi' },
        { property: 'og:description', content: 'Compara estaciones, barrios, meses y patrones de uso para detectar cambios de demanda, rankings y equilibrio en Bizi Zaragoza.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/comparar` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Comparador - DatosBizi' },
        { name: 'twitter:description', content: 'Compara estaciones, barrios, meses y patrones de uso para detectar cambios de demanda, rankings y equilibrio en Bizi Zaragoza.' },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/comparar` }],
      title,
    }
  },
  loader: () => getCompareHubLoaderData(),
  component: ComparePage,
});

export default function ComparePage() {
  const { breadcrumbs, structuredData, comparisonData } = Route.useLoaderData();
  const search = useSearch({ from: Route.fullPath });
  const initialQuery = {
    dimensionId: getFirstSearchParam(search.dimension),
    leftId: getFirstSearchParam(search.left),
    rightId: getFirstSearchParam(search.right),
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
            <Link
              to={appRoutes.dashboardView('research')}
              className="ui-primary-button"
            >
              Abrir análisis en el mapa avanzado
            </Link>
            <Link
              to={appRoutes.explore()}
              className="ui-inline-action"
            >
              Volver al hub Explorar
            </Link>
          </div>
          <PublicSearchForm />
        </div>
      </header>

      <CompareHubContent initialQuery={initialQuery} data={comparisonData} />
    </PageShell>
  );
}
