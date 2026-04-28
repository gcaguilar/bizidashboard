'use client';

import * as React from 'react';
import { Select as SelectPrimitive } from '@base-ui/react/select';
import { cn } from '@/lib/utils';

const Select = SelectPrimitive.Root;

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={(state) =>
        cn(
          'inline-flex min-h-8 items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)] outline-none transition',
          state.open && 'border-[var(--accent)]',
          typeof className === 'function' ? className(state) : className
        )
      }
      {...props}
    >
      {children}
    </SelectPrimitive.Trigger>
  );
});

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>(function SelectValue({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Value
      ref={ref}
      className={(state) =>
        cn(
          'truncate text-left',
          typeof className === 'function' ? className(state) : className
        )
      }
      {...props}
    />
  );
});

function SelectIcon() {
  return (
    <span aria-hidden="true" className="text-xs text-[var(--muted)]">
      ▾
    </span>
  );
}

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Popup>
>(function SelectContent({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner sideOffset={6}>
        <SelectPrimitive.Popup
          ref={ref}
          className={(state) =>
            cn(
              'z-50 min-w-[12rem] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-soft)] outline-none backdrop-blur-md',
              typeof className === 'function' ? className(state) : className
            )
          }
          {...props}
        >
          <SelectPrimitive.List className="max-h-72 overflow-auto">{children}</SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
});

const SelectItem = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={(state) =>
        cn(
          'flex cursor-default items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--foreground)] outline-none',
          state.highlighted && 'bg-[var(--accent)]/10 text-[var(--accent)]',
          state.selected && 'font-semibold',
          typeof className === 'function' ? className(state) : className
        )
      }
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="ml-3 text-xs text-[var(--accent)]">
        ✓
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
});

export { Select, SelectContent, SelectIcon, SelectItem, SelectTrigger, SelectValue };
