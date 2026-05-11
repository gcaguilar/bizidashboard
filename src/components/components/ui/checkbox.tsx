import * as React from 'react';
import { cn } from '@/lib/utils';

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] accent-[var(--primary)]',
        className
      )}
      {...props}
    />
  );
});

export { Checkbox, type CheckboxProps };
