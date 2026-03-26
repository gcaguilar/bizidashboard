import { appRoutes } from '@/lib/routes';

type PublicSearchFormProps = {
  className?: string;
  placeholder?: string;
};

export function PublicSearchForm({
  className,
  placeholder = 'Busca una estacion, un barrio o un identificador',
}: PublicSearchFormProps) {
  return (
    <form
      action={appRoutes.dashboard()}
      method="get"
      className={`flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 ${className ?? ''}`.trim()}
    >
      <label htmlFor="public-search" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
        Buscador global
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="public-search"
          name="q"
          type="search"
          placeholder={placeholder}
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
        >
          Abrir en dashboard
        </button>
      </div>
    </form>
  );
}
