import { DataStateNotice } from '@/app/_components/DataStateNotice';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { InteractiveComparePanel } from '@/app/comparar/_components/InteractiveComparePanel';
import type { ComparisonHubData } from '@/lib/comparison-hub';
import { shouldShowDataStateNotice, type DataState } from '@/lib/data-state';
import { appRoutes } from '@/lib/routes';

export function CompareHubContent({
  initialQuery,
  data,
}: {
  initialQuery: {
    dimensionId?: string | null;
    leftId?: string | null;
    rightId?: string | null;
    scopeId?: string | null;
  };
  data: ComparisonHubData;
}) {
  return (
    <>
      {shouldShowDataStateNotice(data.dataState as DataState) ? (
        <DataStateNotice
          state={data.dataState as DataState}
          subject="las comparativas del hub"
          description="El comparador usa los mismos datos que el mapa, los informes y la API. Si falta parte del histórico o los datos son antiguos, alguna comparación puede estar incompleta."
          href={appRoutes.status()}
          actionLabel="Revisar estado"
        />
      ) : null}

      <InteractiveComparePanel data={data.interactive} initialQuery={initialQuery} />

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Más comparativas automáticas
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">
            Lecturas que ya vienen calculadas
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Si quieres ir más allá de tu selección, estas tarjetas resumen los cambios más
            relevantes de la red.
          </p>
        </div>

        {data.sections.map((section) => (
          <section key={section.id} className="ui-section-card">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                {section.title}
              </p>
              <h3 className="text-lg font-black text-[var(--foreground)]">{section.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{section.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {section.cards.map((card) => (
                <TrackedLink key={card.id} to={card.href} className="ui-surface-block ui-surface-block-interactive">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{card.eyebrow}</p>
                  <h4 className="mt-2 text-lg font-black text-[var(--foreground)]">{card.title}</h4>
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
      </section>
    </>
  );
}
