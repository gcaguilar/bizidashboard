import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmptyStateCardProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  actionLabel?: string;
  actionSlot?: React.ReactElement;
};

const EmptyStateCard = React.forwardRef<HTMLDivElement, EmptyStateCardProps>(function EmptyStateCard(
  { className, title, description, actionLabel, actionSlot, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('mt-4 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-5 text-sm text-[var(--muted)]', className)}
      {...props}
    >
      <p className="font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-1">{description}</p>
      {actionSlot ? (
        <Button asChild variant="ghost" size="sm" className="mt-3 h-auto px-0 py-0 text-xs font-semibold text-[var(--primary)] hover:bg-transparent hover:text-[var(--primary)]">
          {actionSlot}
        </Button>
      ) : actionLabel ? (
        <p className="mt-3 text-xs font-semibold text-[var(--muted)]">{actionLabel}</p>
      ) : null}
    </div>
  );
});

export { EmptyStateCard, type EmptyStateCardProps };
