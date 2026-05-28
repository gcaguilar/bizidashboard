'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { toMonthOptions } from '@/lib/months';
import { buildFilterChangeEvent, trackUmamiEvent } from '@/lib/umami';
import { getLocationSearchParams } from '@/lib/router-search';
import { parseDashboardMonthPeriodSearch } from '@/lib/dashboard-search';

type MonthFilterProps = {
  months: string[];
  activeMonth: string | null;
  className?: string;
  routeKey?: string;
  source?: string;
  preservedSearchKeys?: string[];
};

function MonthFilterContent({
  months,
  activeMonth,
  className,
  routeKey = 'dashboard_unknown',
  source = 'month_filter',
  preservedSearchKeys = [],
}: MonthFilterProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = getLocationSearchParams(location);
  const parsedSearch = parseDashboardMonthPeriodSearch(searchParams);
  const activeMonthFromUrl = parsedSearch.month;
  const currentActiveMonth = activeMonthFromUrl ?? activeMonth;
  const monthOptions = toMonthOptions(months);

  if (monthOptions.length === 0) {
    return null;
  }

  const updateMonth = (nextMonth: string | null) => {
    const nextParams = new URLSearchParams();

    trackUmamiEvent(
      buildFilterChangeEvent({
        surface: 'dashboard',
        routeKey,
        module: 'month_filter',
        source,
        monthPresent: Boolean(nextMonth),
      })
    );

    for (const key of preservedSearchKeys) {
      const value = searchParams.get(key);
      if (value !== null) {
        nextParams.set(key, value);
      }
    }

    if (nextMonth) {
      nextParams.set('month', nextMonth);
    } else {
      nextParams.delete('month');
    }

    const currentQuery = searchParams.toString();
    const nextQuery = nextParams.toString();
    if (nextQuery === currentQuery) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void navigate({ search: Object.fromEntries(nextParams) as any, replace: true });
  };

  return (
    <div className={className}>
      <div className='flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 shadow-[var(--shadow-soft)]'>
        <span className='text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]'>Mes</span>
        <Button
          onClick={() => updateMonth(null)}
          variant={currentActiveMonth === null ? 'default' : 'chip'}
          size="sm"
        >
          Acumulado
        </Button>
        {monthOptions.map((month) => (
          <Button
            key={month.key}
            onClick={() => updateMonth(month.key)}
            variant={currentActiveMonth === month.key ? 'default' : 'chip'}
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
