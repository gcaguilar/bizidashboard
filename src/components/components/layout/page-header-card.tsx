import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type PageHeaderCardProps = HTMLAttributes<HTMLElement> & {
  sticky?: boolean;
};

export function PageHeaderCard({ className, sticky = true, ...props }: PageHeaderCardProps) {
  return (
    <header
      className={cn(
        'rounded-xl border border-[var(--border)] bg-[var(--card)]/95 px-4 py-3 shadow-[var(--shadow-md)] backdrop-blur-md',
        sticky ? 'sticky top-0 z-50' : '',
        className
      )}
      {...props}
    />
  );
}
