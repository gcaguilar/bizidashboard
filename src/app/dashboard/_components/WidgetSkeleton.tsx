import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type WidgetSkeletonProps = {
  className?: string;
  lines?: number;
};

export const WidgetSkeleton = memo(function WidgetSkeleton({ className = '', lines = 3 }: WidgetSkeletonProps) {
  return (
    <div className={`dashboard-card animate-pulse ${className}`.trim()}>
      <Skeleton className="h-4 w-32" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className="h-4" />
        ))}
      </div>
    </div>
  );
});
