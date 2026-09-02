import { DataStateNotice } from '@/app/_components/DataStateNotice';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { InteractiveComparePanel } from '@/app/comparar/_components/InteractiveComparePanel';
import type { ComparisonHubData } from '@/lib/comparison-hub';
import { shouldShowDataStateNotice, type DataState } from '@/lib/data-state';
import { formatDateLabel } from '@/lib/format';
import { formatMonthLabel } from '@/lib/months';
import { appRoutes } from '@/lib/routes';

export function CompareHubContent({
  initialQuery,
  data,
}: {
  initialQuery: {
    dimensionId?: string | null;
    leftId?: string | null;
    rightId?: string | null;
  };
  data: ComparisonHubData;
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

      {shouldShowDataStateNotice(data.dataState as DataState) ? (
        <DataStateNotice
          state={data.dataState as DataState}
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
              <TrackedLink key={card.id} to={card.href} className="ui-surface-block ui-surface-block-interactive">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{card.eyebrow}</p>
                <h3 className="mt-2 text-lg font-black text-[var(--foreground)]">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{card.summary}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]">{card.metricA}</p>
                  <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]">{card.metricB}</p>
                </div>
                <p className="mt-3 text-sm font-bold text-[var(--primary)]">{card.delta}</p>
                {card.note ? <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{card.note}</p> : null}
              </TrackedLink>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
