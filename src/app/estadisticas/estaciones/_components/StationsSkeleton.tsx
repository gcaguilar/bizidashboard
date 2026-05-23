export function StationsSkeleton() {
  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-[var(--muted)]">Cargando estaciones...</p>
      <div className="flex flex-wrap gap-2 overflow-x-auto">
        {['Todas', 'Con bicis', 'Con huecos', 'Casi vacías', 'Casi llenas', 'Favoritas'].map((label) => (
          <div key={label} className="h-8 w-20 animate-pulse rounded-full bg-[var(--border)]" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="ui-metric-card animate-pulse space-y-3 p-4">
            <div className="h-4 w-3/4 rounded bg-[var(--border)]" />
            <div className="flex gap-2">
              <div className="h-3 w-16 rounded bg-[var(--border)]" />
              <div className="h-3 w-16 rounded bg-[var(--border)]" />
            </div>
            <div className="h-2 w-full rounded bg-[var(--border)]" />
            <div className="h-5 w-20 rounded-full bg-[var(--border)]" />
          </div>
        ))}
      </div>
    </div>
  );
}