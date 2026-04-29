import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageShellProps = HTMLAttributes<HTMLElement> & {
  as?: 'main' | 'section' | 'div';
  children: ReactNode;
  maxWidthClassName?: string;
};

export function PageShell({
  as = 'main',
  className,
  children,
  maxWidthClassName = 'max-w-[1280px]',
  ...props
}: PageShellProps) {
  const Comp = as;

  return (
    <Comp
      className={cn(
        'mx-auto flex min-h-screen w-full flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8',
        maxWidthClassName,
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
