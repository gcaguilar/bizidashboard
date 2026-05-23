'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation, useRouter } from '@tanstack/react-router';
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
  const location = useLocation();
  const pathname = location.pathname;
  const searchParams = new URLSearchParams((location as { searchStr?: string }).searchStr ?? '');
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
    void router.navigate({ to: nextQuery ? `${pathname}?${nextQuery}` : pathname, replace: true });
  };

  return (
    <div className={className}>
      <div className='flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 shadow-[var(--shadow-soft)]'>
        <span className='text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]'>Mes</span>
        <Button
          onClick={() => updateMonth(null)}
          variant={activeMonth === null ? 'default' : 'chip'}
          size="sm"
        >
          Acumulado
        </Button>
        {monthOptions.map((month) => (
          <Button
            key={month.key}
            onClick={() => updateMonth(month.key)}
            variant={activeMonth === month.key ? 'default' : 'chip'}
            size="sm"
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
    <Suspense fallback={<Skeleton className="h-10 w-full rounded-xl" />}>
      <MonthFilterContent {...props} />
    </Suspense>
  );
}
