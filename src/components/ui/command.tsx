'use client';

import * as React from 'react';
import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';
import { cn } from '@/lib/utils';

const Command = ComboboxPrimitive.Root;

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Input>
>(function CommandInput({ className, ...props }, ref) {
  return (
    <ComboboxPrimitive.Input
      ref={ref}
      className={(state) =>
        cn(
          'min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--primary)]/45',
          typeof className === 'function' ? className(state) : className
        )
      }
      {...props}
    />
  );
});

const CommandList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.List>
>(function CommandList({ className, ...props }, ref) {
  return (
    <ComboboxPrimitive.List
      ref={ref}
      className={(state) =>
        cn(
          'mt-2 max-h-72 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-1',
          typeof className === 'function' ? className(state) : className
        )
      }
      {...props}
    />
  );
});

const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Item>
>(function CommandItem({ className, children, ...props }, ref) {
  return (
    <ComboboxPrimitive.Item
      ref={ref}
      className={(state) =>
        cn(
          'flex cursor-default items-center justify-between rounded-md px-3 py-2 text-sm text-[var(--foreground)] outline-none',
          state.highlighted && 'bg-[var(--primary)]/10 text-[var(--primary)]',
          state.selected && 'font-semibold',
          typeof className === 'function' ? className(state) : className
        )
      }
      {...props}
    >
      {children}
    </ComboboxPrimitive.Item>
  );
});

const CommandEmpty = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Empty>
>(function CommandEmpty({ className, ...props }, ref) {
  return (
    <ComboboxPrimitive.Empty
      ref={ref}
      className={(state) =>
        cn(
          'px-3 py-3 text-sm text-[var(--muted)]',
          typeof className === 'function' ? className(state) : className
        )
      }
      {...props}
    />
  );
});

const CommandGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CommandGroup({ className, ...props }, ref) {
    return <div ref={ref} className={cn('space-y-1', className)} {...props} />;
  }
);

export { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList };
