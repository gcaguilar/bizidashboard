import * as React from 'react';
import { cn } from '@/lib/utils';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('animate-pulse rounded-md bg-[var(--surface-soft)]', className)}
      {...props}
    />
  );
});

export { Skeleton, type SkeletonProps };

