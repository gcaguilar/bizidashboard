type DashboardPageLoadingProps = {
  title: string;
  subtitle?: string;
};

export function DashboardPageLoading({ title, subtitle }: DashboardPageLoadingProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 shadow-[var(--shadow-soft)]">
        <div className="flex animate-pulse flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[var(--surface-soft)]" />
            <div className="h-5 w-40 rounded bg-[var(--surface-soft)]" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 rounded-full bg-[var(--surface-soft)]" />
            <div className="h-9 w-24 rounded-full bg-[var(--surface-soft)]" />
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-28 rounded bg-[var(--surface-soft)]" />
          <div className="h-8 w-72 max-w-full rounded bg-[var(--surface-soft)]" />
          <div className="h-4 w-full rounded bg-[var(--surface-soft)]" />
          <div className="h-4 w-3/4 rounded bg-[var(--surface-soft)]" />
        </div>
        <div className="mt-4 text-sm text-[var(--muted)]">
          <span className="font-semibold text-[var(--foreground)]">{title}</span>
          {subtitle ? ` · ${subtitle}` : ''}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="dashboard-card animate-pulse">
            <div className="h-3 w-28 rounded bg-[var(--surface-soft)]" />
            <div className="mt-4 h-10 w-24 rounded bg-[var(--surface-soft)]" />
            <div className="mt-3 h-4 w-full rounded bg-[var(--surface-soft)]" />
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <article key={index} className="dashboard-card animate-pulse">
            <div className="h-5 w-48 rounded bg-[var(--surface-soft)]" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((__, rowIndex) => (
                <div key={rowIndex} className="h-16 rounded-lg bg-[var(--surface-soft)]" />
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
