import * as React from 'react';
import { cn } from '@/lib/utils';

type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement>;

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { className, ...props },
  ref
) {
  return <div ref={ref} className={cn('overflow-auto', className)} {...props} />;
});

export { ScrollArea, type ScrollAreaProps };
