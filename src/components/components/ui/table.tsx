import * as React from 'react';
import { cn } from '@/lib/utils';

const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  function Table({ className, ...props }, ref) {
    return (
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm text-[var(--foreground)]', className)}
        {...props}
      />
    );
  }
);

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function TableHeader({ className, ...props }, ref) {
  return <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />;
});

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  function TableBody({ className, ...props }, ref) {
    return <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
  }
);

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  function TableRow({ className, ...props }, ref) {
    return <tr ref={ref} className={cn('border-b border-[var(--border)] transition-colors', className)} {...props} />;
  }
);

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  function TableHead({ className, ...props }, ref) {
    return (
      <th
        ref={ref}
        className={cn(
          'h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-[0.09em] text-[var(--muted)]',
          className
        )}
        {...props}
      />
    );
  }
);

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  function TableCell({ className, ...props }, ref) {
    return <td ref={ref} className={cn('px-3 py-2 align-middle', className)} {...props} />;
  }
);

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  function TableCaption({ className, ...props }, ref) {
    return <caption ref={ref} className={cn('mt-3 text-xs text-[var(--muted)]', className)} {...props} />;
  }
);

export { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow };
