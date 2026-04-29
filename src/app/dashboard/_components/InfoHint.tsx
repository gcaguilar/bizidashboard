'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type InfoHintProps = {
  label: string;
  content: string;
};

export function InfoHint({ label, content }: InfoHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={label}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)] text-[11px] font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
      >
        i
      </TooltipTrigger>
      <TooltipContent>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
