'use client';

import * as React from 'react';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Popup>
>(function TooltipContent({ className, children, ...props }, ref) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner sideOffset={8}>
        <TooltipPrimitive.Popup
          ref={ref}
          className={(state) =>
            cn(
              'z-50 w-64 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-[11px] leading-relaxed text-[var(--foreground)] shadow-[var(--shadow-soft)] backdrop-blur-md',
              typeof className === 'function' ? className(state) : className
            )
          }
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
});

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
