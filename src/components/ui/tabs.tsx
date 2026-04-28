'use client';

import * as React from 'react';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={(state) =>
        cn(
          'flex gap-1 border-b border-[var(--border)]',
          typeof className === 'function' ? className(state) : className
        )
      }
      {...props}
    />
  );
});

const TabsTrigger = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Tab>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Tab
      ref={ref}
      className={(state) =>
        cn(
          'rounded-t-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors outline-none',
          state.active
            ? 'border-b-0 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]'
            : 'text-[var(--muted)] hover:text-[var(--foreground)]',
          typeof className === 'function' ? className(state) : className
        )
      }
      {...props}
    />
  );
});

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Panel>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Panel
      ref={ref}
      className={(state) =>
        cn(
          'space-y-6 outline-none',
          typeof className === 'function' ? className(state) : className
        )
      }
      {...props}
    />
  );
});

export { Tabs, TabsContent, TabsList, TabsTrigger };
