'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';

function Dialog(props: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) {
  if (typeof document === 'undefined') {
    const isOpen = props.open ?? props.defaultOpen ?? false;
    return isOpen ? <>{props.children}</> : null;
  }

  return <DialogPrimitive.Root {...props} />;
}
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Backdrop>
>(function DialogOverlay({ className, ...props }, ref) {
  if (typeof document === 'undefined') {
    return <div ref={ref} className={cn('fixed inset-0 z-50 bg-black/55', typeof className === 'string' ? className : undefined)} />;
  }

  return (
    <DialogPrimitive.Backdrop
      ref={ref}
      className={(state) =>
        cn(
          'fixed inset-0 z-50 bg-black/55',
          typeof className === 'function' ? className(state) : className
        )
      }
      {...props}
    />
  );
});

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Popup>
>(function DialogContent({ className, children, ...props }, ref) {
  if (typeof document === 'undefined') {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/55" />
        <div
          ref={ref}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--primary)]/30 bg-[var(--card)] p-6 shadow-2xl outline-none md:p-8',
            typeof className === 'string' ? className : undefined
          )}
        >
          {children}
        </div>
      </>
    );
  }

  const body = (
    <>
      <DialogOverlay />
      <DialogPrimitive.Popup
        ref={ref}
        className={(state) =>
          cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--primary)]/30 bg-[var(--card)] p-6 shadow-2xl outline-none md:p-8',
            typeof className === 'function' ? className(state) : className
          )
        }
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </>
  );

  return (
    <DialogPortal>
      {body}
    </DialogPortal>
  );
});

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function DialogHeader({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex flex-col space-y-2 text-left', className)} {...props} />;
});

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, style, ...props }, ref) {
  if (typeof document === 'undefined') {
    const htmlStyle = typeof style === 'function' ? undefined : style;

    return (
      <h2
        ref={ref}
        style={htmlStyle}
        className={cn(
          'text-2xl font-black text-[var(--foreground)] md:text-4xl',
          typeof className === 'string' ? className : undefined
        )}
        {...props}
      />
    );
  }

  return (
    <DialogPrimitive.Title
      ref={ref}
      className={(state) =>
        cn(
          'text-2xl font-black text-[var(--foreground)] md:text-4xl',
          typeof className === 'function' ? className(state) : className
        )
      }
      {...props}
    />
  );
});

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
