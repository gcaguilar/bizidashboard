'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toMonthOptions } from '@/lib/months';
import { buildFilterChangeEvent, trackUmamiEvent } from '@/lib/umami';

type MonthFilterProps = {
  months: string[];
  activeMonth: string | null;
  className?: string;
  routeKey?: string;
  source?: string;
};

function MonthFilterContent({
  months,
  activeMonth,
  className,
  routeKey = 'dashboard_unknown',
  source = 'month_filter',
}: MonthFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const monthOptions = toMonthOptions(months);

  if (monthOptions.length === 0) {
    return null;
  }

  const updateMonth = (nextMonth: string | null) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    trackUmamiEvent(
      buildFilterChangeEvent({
        surface: 'dashboard',
        routeKey,
        module: 'month_filter',
        source,
        monthPresent: Boolean(nextMonth),
      })
    );

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
      <div className='flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 shadow-[var(--shadow-soft)]'>
        <span className='text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]'>Mes</span>
        <Button
          onClick={() => updateMonth(null)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            activeMonth === null
              ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
              : 'border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]'
          }`}
          variant='ghost'
          size='sm'
        >
          Acumulado
        </Button>
        {monthOptions.map((month) => (
          <Button
            key={month.key}
            onClick={() => updateMonth(month.key)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${
              activeMonth === month.key
                ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                : 'border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]'
            }`}
            variant='ghost'
            size='sm'
          >
            {month.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function MonthFilter(props: MonthFilterProps) {
  return (
    <Suspense fallback={<div className='h-10 w-full animate-pulse rounded-xl bg-[var(--secondary)]' />}>
      <MonthFilterContent {...props} />
    </Suspense>
  );
}
