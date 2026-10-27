'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocale } from '@/lib/i18n/use-locale';
import { getActivityIndexUnits } from '@/lib/product-copy';

/** Icono "i" con la explicación única del índice de actividad (ver `activityIndexUnits`). */
export function ActivityIndexHint({ className }: { className?: string }) {
  const activityIndexUnits = getActivityIndexUnits(useLocale());

  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={activityIndexUnits.tooltipLabel}
        className={
          className ??
          'inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)] align-middle text-[10px] font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]'
        }
      >
        i
      </TooltipTrigger>
      <TooltipContent>{activityIndexUnits.tooltip}</TooltipContent>
    </Tooltip>
  );
}
