import { PageShell } from '@/components/layout/page-shell';
import { Skeleton } from '@/components/ui/skeleton';

export function PublicPageLoading() {
  return (
    <PageShell>
      <div className="ui-page-hero">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="mt-2 h-9 w-56" />
        <Skeleton className="mt-3 h-4 w-80" />
        <Skeleton className="mt-1 h-4 w-64" />
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">Cargando datos actualizados...</p>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-[var(--radius-lg)]" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-[var(--radius-lg)]" />
      <Skeleton className="h-32 rounded-[var(--radius-lg)]" />
    </PageShell>
  );
}
