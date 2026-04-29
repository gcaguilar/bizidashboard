import * as React from 'react';
import { cn } from '@/lib/utils';

const Breadcrumb = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<'nav'>>(
  function Breadcrumb({ className, ...props }, ref) {
    return <nav ref={ref} aria-label="Breadcrumb" className={cn('', className)} {...props} />;
  }
);

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<'ol'>>(
  function BreadcrumbList({ className, ...props }, ref) {
    return (
      <ol
        ref={ref}
        className={cn('flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]', className)}
        {...props}
      />
    );
  }
);

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  function BreadcrumbItem({ className, ...props }, ref) {
    return <li ref={ref} className={cn('flex items-center gap-2', className)} {...props} />;
  }
);

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<'a'>>(
  function BreadcrumbLink({ className, ...props }, ref) {
    return (
      <a
        ref={ref}
        className={cn(
          'rounded-sm transition hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
          className
        )}
        {...props}
      />
    );
  }
);

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
  function BreadcrumbPage({ className, ...props }, ref) {
    return <span ref={ref} aria-current="page" className={cn('font-semibold text-[var(--foreground)]', className)} {...props} />;
  }
);

const BreadcrumbSeparator = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
  function BreadcrumbSeparator({ className, children = '/', ...props }, ref) {
    return (
      <span ref={ref} aria-hidden="true" className={cn('text-[var(--muted)]', className)} {...props}>
        {children}
      </span>
    );
  }
);

export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
