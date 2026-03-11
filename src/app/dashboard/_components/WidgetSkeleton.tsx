type WidgetSkeletonProps = {
  className?: string;
  lines?: number;
};

export function WidgetSkeleton({ className = '', lines = 3 }: WidgetSkeletonProps) {
  return (
    <div className={`dashboard-card animate-pulse ${className}`.trim()}>
      <div className="h-4 w-32 rounded bg-[var(--surface-soft)]" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="h-4 rounded bg-[var(--surface-soft)]" />
        ))}
      </div>
    </div>
  );
}
