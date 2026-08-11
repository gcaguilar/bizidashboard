'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate, useSearch } from '@tanstack/react-router';
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
  const navigate = useNavigate();
  // El filtro se monta en varias rutas del dashboard, asi que lee el search sin fijar ruta.
  const activeMonthFromUrl = useSearch({
    strict: false,
    select: (search) => (search as { month?: string }).month ?? null,
  });
  const currentActiveMonth = activeMonthFromUrl ?? activeMonth;
  const monthOptions = toMonthOptions(months);

  if (monthOptions.length === 0) {
    return null;
  }

  const updateMonth = (nextMonth: string | null) => {
    if (nextMonth === currentActiveMonth) {
      return;
    }

    trackUmamiEvent(
      buildFilterChangeEvent({
        surface: 'dashboard',
        routeKey,
        module: 'month_filter',
        source,
        monthPresent: Boolean(nextMonth),
      })
    );

    void navigate({
      replace: true,
      to: '.',
      search: (prev: Record<string, unknown>) => ({ ...prev, month: nextMonth ?? undefined }),
    });
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
