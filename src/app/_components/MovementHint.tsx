'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { movementUnits } from '@/lib/product-copy';

/** Icono "i" con la explicación única del movimiento estimado (ver `movementUnits`). */
export function MovementHint({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={movementUnits.tooltipLabel}
        className={
          className ??
          'inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)] align-middle text-[10px] font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]'
        }
      >
        i
      </TooltipTrigger>
      <TooltipContent>{movementUnits.tooltip}</TooltipContent>
    </Tooltip>
  );
}
