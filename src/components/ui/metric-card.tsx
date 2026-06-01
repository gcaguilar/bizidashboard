import * as React from 'react';
import { cn } from '@/lib/utils';

type MetricCardProps = React.HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
};

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(function MetricCard(
  { className, label, value, detail, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('ui-metric-card rounded-xl px-4 py-4', className)}
      {...props}
    >
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {detail ? <p className="text-[11px] text-[var(--muted)]">{detail}</p> : null}
    </div>
  );
});

const MetricGrid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { columns?: 2 | 3 | 4 }>(
  function MetricGrid({ className, columns = 4, ...props }, ref) {
    const colsClass = columns === 2 ? 'sm:grid-cols-2' : columns === 3 ? 'sm:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-4';
    return <div ref={ref} className={cn('mt-4 grid gap-3', colsClass, className)} {...props} />;
  }
);

export { MetricCard, MetricGrid, type MetricCardProps };
