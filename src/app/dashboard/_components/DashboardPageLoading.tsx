import { Skeleton } from '@/components/ui/skeleton';
import { PageShell } from '@/components/layout/page-shell';

type DashboardPageLoadingProps = {
  title: string;
  subtitle?: string;
};

export function DashboardPageLoading({ title, subtitle }: DashboardPageLoadingProps) {
  return (
    <PageShell>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/95 px-4 py-3 shadow-[var(--shadow-soft)]">
        <div className="flex animate-pulse flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)]">
        <div className="animate-pulse space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="mt-4 text-sm text-[var(--muted)]">
          <span className="font-semibold text-[var(--foreground)]">{title}</span>
          {subtitle ? ` · ${subtitle}` : ''}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="ui-section-card animate-pulse">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-4 h-10 w-24" />
            <Skeleton className="mt-3 h-4 w-full" />
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <article key={index} className="ui-section-card animate-pulse">
            <Skeleton className="h-5 w-48" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((__, rowIndex) => (
                <Skeleton key={rowIndex} className="h-16 rounded-lg" />
              ))}
            </div>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
