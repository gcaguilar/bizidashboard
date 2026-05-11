import * as React from 'react';
import { cn } from '@/lib/utils';

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
  indicatorClassName?: string;
};

function toProgress(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { className, value = 0, indicatorClassName, ...props },
  ref
) {
  const clamped = toProgress(value);

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-black/20', className)}
      {...props}
    >
      <div
        className={cn('h-full rounded-full bg-[var(--primary)] transition-[width]', indicatorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
});

export { Progress, type ProgressProps };
