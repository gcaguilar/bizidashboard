import * as React from 'react';
import { cn } from '@/lib/utils';

type AlertVariant = 'default' | 'success' | 'warning' | 'danger';

const ALERT_VARIANT_CLASSES: Record<AlertVariant, string> = {
  default: 'border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]',
  success: 'border-[var(--success)]/40 bg-[var(--success)]/12 text-[var(--foreground)]',
  warning: 'border-[var(--warning)]/40 bg-[var(--warning)]/12 text-[var(--foreground)]',
  danger: 'border-[var(--danger)]/40 bg-[var(--danger)]/12 text-[var(--foreground)]',
};

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { className, variant = 'default', ...props },
  ref
) {
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'w-full rounded-xl border px-3 py-2 text-sm',
        ALERT_VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
});

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  function AlertTitle({ className, ...props }, ref) {
    return <p ref={ref} className={cn('font-semibold text-[var(--foreground)]', className)} {...props} />;
  }
);

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  function AlertDescription({ className, ...props }, ref) {
    return <p ref={ref} className={cn('mt-1 text-xs text-[var(--muted)]', className)} {...props} />;
  }
);

export { Alert, AlertDescription, AlertTitle, type AlertProps, type AlertVariant };

