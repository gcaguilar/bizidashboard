import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'muted' | 'success' | 'warning' | 'danger';

const BADGE_VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'border-[var(--primary)]/35 bg-[var(--primary)]/10 text-[var(--primary)]',
  muted: 'border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)]',
  success: 'border-[var(--success)]/40 bg-[var(--success)]/12 text-[var(--success)]',
  warning: 'border-[var(--warning)]/40 bg-[var(--warning)]/12 text-[var(--warning)]',
  danger: 'border-[var(--danger)]/40 bg-[var(--danger)]/12 text-[var(--danger)]',
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant = 'default', ...props },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.09em]',
        BADGE_VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
});

export { Badge, type BadgeProps, type BadgeVariant };
