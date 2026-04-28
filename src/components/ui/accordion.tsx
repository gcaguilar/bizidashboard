'use client';

import * as React from 'react';
import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import { cn } from '@/lib/utils';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={(state) =>
        cn(
          'overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]',
          typeof className === 'function' ? className(state) : className
        )
      }
      {...props}
    />
  );
});

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(function AccordionTrigger({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={(state) =>
          cn(
            'flex w-full items-center justify-between gap-4 px-5 py-4 text-left outline-none',
            state.open ? 'text-[var(--foreground)]' : 'text-[var(--foreground)]',
            typeof className === 'function' ? className(state) : className
          )
        }
        {...props}
      >
        <span className="text-base font-semibold">{children}</span>
        <span className="text-lg font-bold text-[var(--muted)]" aria-hidden="true">
          +
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Panel>
>(function AccordionContent({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Panel
      ref={ref}
      className={(state) =>
        cn(
          'border-t border-[var(--border)] px-5 py-4 text-sm leading-relaxed text-[var(--muted)]',
          typeof className === 'function' ? className(state) : className
        )
      }
      {...props}
    />
  );
});

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
