'use client';

import * as React from 'react';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverClose = PopoverPrimitive.Close;
const PopoverPortal = PopoverPrimitive.Portal;

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Popup>
>(function PopoverContent({ className, children, ...props }, ref) {
  return (
    <PopoverPortal>
      <PopoverPrimitive.Positioner sideOffset={8}>
        <PopoverPrimitive.Popup
          ref={ref}
          className={(state) =>
            cn(
              'z-50 min-w-[16rem] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-soft)] outline-none backdrop-blur-md',
              typeof className === 'function' ? className(state) : className
            )
          }
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPortal>
  );
});

export { Popover, PopoverClose, PopoverContent, PopoverPortal, PopoverTrigger };

