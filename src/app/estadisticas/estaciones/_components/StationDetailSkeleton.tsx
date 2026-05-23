import { PageShell } from '@/components/layout/page-shell';
import { StatsSecondaryNav } from '@/app/estadisticas/_components/StatsSecondaryNav';

export function StationDetailSkeleton() {
  return (
    <PageShell>
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <div className="flex gap-2 text-xs text-[var(--muted)]">
          <div className="h-3 w-24 animate-pulse rounded bg-[var(--border)]" />
          <span>/</span>
          <div className="h-3 w-32 animate-pulse rounded bg-[var(--border)]" />
          <span>/</span>
          <div className="h-3 w-40 animate-pulse rounded bg-[var(--border)]" />
        </div>
      </div>
      <StatsSecondaryNav className="mt-1" />
      <header className="ui-page-hero">
        <div className="h-3 w-36 animate-pulse rounded bg-[var(--border)]" />
        <div className="mt-2 h-8 w-64 animate-pulse rounded bg-[var(--border)]" />
        <div className="mt-3 h-3 w-96 animate-pulse rounded bg-[var(--border)]" />
      </header>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">Preparando datos de la estacion...</p>
      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="ui-section-card animate-pulse">
            <div className="h-3 w-16 rounded bg-[var(--border)]" />
            <div className="mt-2 h-7 w-12 rounded bg-[var(--border)]" />
          </div>
        ))}
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="ui-section-card animate-pulse lg:col-span-2">
          <div className="h-5 w-32 rounded bg-[var(--border)]" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-[var(--border)]" />
            <div className="h-3 w-3/4 rounded bg-[var(--border)]" />
          </div>
        </div>
        <div className="ui-section-card animate-pulse">
          <div className="h-5 w-24 rounded bg-[var(--border)]" />
          <div className="mt-4 space-y-3">
            <div className="h-3 w-20 rounded bg-[var(--border)]" />
            <div className="h-3 w-full rounded bg-[var(--border)]" />
            <div className="h-3 w-20 rounded bg-[var(--border)]" />
            <div className="h-3 w-full rounded bg-[var(--border)]" />
          </div>
        </div>
      </section>
      <section className="mt-4">
        <div className="ui-section-card animate-pulse">
          <div className="h-5 w-36 rounded bg-[var(--border)]" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="ui-surface-block space-y-2">
                <div className="h-3 w-3/4 rounded bg-[var(--border)]" />
                <div className="h-3 w-full rounded bg-[var(--border)]" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mt-4">
        <div className="ui-section-card animate-pulse">
          <div className="h-5 w-28 rounded bg-[var(--border)]" />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="ui-surface-block space-y-2">
                <div className="h-3 w-1/2 rounded bg-[var(--border)]" />
                <div className="h-3 w-3/4 rounded bg-[var(--border)]" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mt-4">
        <div className="ui-section-card animate-pulse">
          <div className="h-5 w-36 rounded bg-[var(--border)]" />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="ui-metric-card space-y-2">
                <div className="h-4 w-3/4 rounded bg-[var(--border)]" />
                <div className="h-3 w-1/2 rounded bg-[var(--border)]" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mt-4">
        <div className="ui-section-card animate-pulse">
          <div className="h-5 w-36 rounded bg-[var(--border)]" />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="ui-surface-block space-y-2">
                <div className="h-3 w-3/4 rounded bg-[var(--border)]" />
                <div className="h-3 w-1/2 rounded bg-[var(--border)]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}