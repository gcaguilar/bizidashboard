'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toMonthOptions } from '@/lib/months';

type MonthFilterProps = {
  months: string[];
  activeMonth: string | null;
  className?: string;
};

export function MonthFilter({ months, activeMonth, className }: MonthFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const monthOptions = toMonthOptions(months);

  if (monthOptions.length === 0) {
    return null;
  }

  const updateMonth = (nextMonth: string | null) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (nextMonth) {
      nextParams.set('month', nextMonth);
    } else {
      nextParams.delete('month');
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 shadow-[var(--shadow-soft)]">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Mes</span>
        <button
          type="button"
          onClick={() => updateMonth(null)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            activeMonth === null
              ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
              : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]'
          }`}
        >
          Acumulado
        </button>
        {monthOptions.map((month) => (
          <button
            key={month.key}
            type="button"
            onClick={() => updateMonth(month.key)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${
              activeMonth === month.key
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]'
            }`}
          >
            {month.label}
          </button>
        ))}
      </div>
    </div>
  );
}
