import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { DataStateNotice } from '@/app/_components/DataStateNotice';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { InteractiveComparePanel } from '@/app/comparar/_components/InteractiveComparePanel';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { shouldShowDataStateNotice } from '@/lib/data-state';
import {
  buildFallbackComparisonHubData,
  getComparisonHubDataWithTimeout,
} from '@/lib/comparison-hub';
import { formatMonthLabel } from '@/lib/months';
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes';
import { buildPageMetadata } from '@/lib/seo';
import { getCityName } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Comparador',
  description:
    'Hub comparativo para leer estacion vs estacion, barrio vs barrio, mes vs mes, ano vs ano y cambios de demanda, rankings y balance.',
  path: appRoutes.compare(),
});

type ComparePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstSearchParam(
  value: string | string[] | undefined
): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function CompareHubFallback({
  initialQuery,
}: {
  initialQuery: {
    dimensionId?: string | null;
    leftId?: string | null;
    rightId?: string | null;
  };
}) {
  const data = buildFallbackComparisonHubData();

  return (
    <>
      {shouldShowDataStateNotice('loading') ? (
        <DataStateNotice
          state="loading"
          subject="las comparativas del hub"
          description="Estamos preparando el snapshot comparativo compartido."
          href={appRoutes.status()}
          actionLabel="Revisar estado"
        />
      ) : null}

      <InteractiveComparePanel data={data.interactive} initialQuery={initialQuery} />

      <section className="grid gap-4 md:grid-cols-3">
        {data.sections.map((section) => (
          <article key={section.id} className="dashboard-card">
            <p className="stat-label">{section.title}</p>
            <p className="stat-value">{section.cards.length}</p>
            <p className="text-xs text-[var(--muted)]">{section.description}</p>
          </article>
        ))}
      </section>
    </>
  );
}

async function CompareHubContent({
  initialQuery,
}: {
  initialQuery: {
    dimensionId?: string | null;
    leftId?: string | null;
    rightId?: string | null;
  };
}) {
  const data = await getComparisonHubDataWithTimeout();
  const comparisonCount = data.sections.reduce((count, section) => count + section.cards.length, 0);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="dashboard-card">
          <p className="stat-label">Comparativas activas</p>
          <p className="stat-value">{comparisonCount}</p>
          <p className="text-xs text-[var(--muted)]">Lecturas listas para explorar ahora mismo.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Ultimo mes</p>
          <p className="stat-value">{data.latestMonth ? formatMonthLabel(data.latestMonth) : 'Sin dato'}</p>
          <p className="text-xs text-[var(--muted)]">Referencia temporal mas reciente publicada.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Generado</p>
          <p className="stat-value">{new Date(data.generatedAt).toLocaleDateString('es-ES')}</p>
          <p className="text-xs text-[var(--muted)]">Snapshot compartido del comparador.</p>
        </article>
      </section>

      {shouldShowDataStateNotice(data.dataState) ? (
        <DataStateNotice
          state={data.dataState}
          subject="las comparativas del hub"
          description="El comparador usa el mismo snapshot compartido que dashboard, informes y API. Si ves cobertura parcial o dataset antiguo, las lecturas comparativas pueden no estar completas."
          href={appRoutes.status()}
          actionLabel="Revisar estado"
        />
      ) : null}

      <InteractiveComparePanel data={data.interactive} initialQuery={initialQuery} />

      {data.sections.map((section) => (
        <section key={section.id} className="dashboard-card">
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
                href={card.href}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  {card.eyebrow}
                </p>
                <h3 className="mt-2 text-lg font-black text-[var(--foreground)]">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{card.summary}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]">
                    {card.metricA}
                  </p>
                  <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]">
                    {card.metricB}
                  </p>
                </div>
                <p className="mt-3 text-sm font-bold text-[var(--accent)]">{card.delta}</p>
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

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const cityName = getCityName();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Comparar',
    href: appRoutes.compare(),
  });
  const initialQuery = {
    dimensionId: getFirstSearchParam(resolvedSearchParams.dimension),
    leftId: getFirstSearchParam(resolvedSearchParams.left),
    rightId: getFirstSearchParam(resolvedSearchParams.right),
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              buildBreadcrumbStructuredData(breadcrumbs),
              {
                '@type': 'CollectionPage',
                name: `Comparador ${cityName}`,
                description:
                  'Comparativas activas entre estaciones, barrios, periodos y cambios del sistema.',
                url: toAbsoluteRouteUrl(appRoutes.compare()),
              },
            ],
          }),
        }}
      />

      <header className="hero-card">
        <SiteBreadcrumbs items={breadcrumbs} />
        <PublicSectionNav activeHref={appRoutes.dashboard()} className="mt-1" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Analisis comparativo
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Comparador {cityName}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Superficie publica para comparar estaciones, barrios, meses, anos, horas, periodos y
              cambios recientes de rankings, demanda y balance a partir del historico compartido.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-wrap gap-3">
            <Link
              href={appRoutes.dashboardView('research')}
              className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
            >
              Abrir analisis del dashboard
            </Link>
            <Link
              href={appRoutes.explore()}
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
            >
              Volver al hub Explorar
            </Link>
          </div>
          <PublicSearchForm />
        </div>
      </header>

      <Suspense fallback={<CompareHubFallback initialQuery={initialQuery} />}>
        <CompareHubContent initialQuery={initialQuery} />
      </Suspense>
    </main>
  );
}
