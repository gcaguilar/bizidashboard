'use client';

import * as React from 'react';
import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/react-dom';
import { cn } from '@/lib/utils';

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
} | null>(null);

function usePopoverContext() {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) throw new Error('Popover must be used inside a Popover root');
  return ctx;
}

const Popover = ({ open, onOpenChange, children }: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const trigger = triggerRef.current;
    const content = contentRef.current;
    if (!trigger || !content || !open) return;

    const cleanup = autoUpdate(trigger, content, () => {
      computePosition(trigger, content, {
        middleware: [offset(8), flip(), shift()],
      }).then(({ x, y }) => {
        Object.assign(content.style, {
          position: 'absolute',
          left: `${x}px`,
          top: `${y}px`,
        });
      }).catch(() => {});
    });

    return cleanup;
  }, [open]);

  return (
    <PopoverContext.Provider value={{ open, setOpen: onOpenChange || (() => {}), triggerRef, contentRef }}>
      {children}
    </PopoverContext.Provider>
  );
};

const PopoverTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  function PopoverTrigger({ onClick, ...props }, ref) {
    const { open, setOpen, triggerRef } = usePopoverContext();
    const mergedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        if (typeof triggerRef === 'function') triggerRef(node);
        else if (triggerRef) triggerRef.current = node;
      },
      [triggerRef]
    );
    return (
      <button
        ref={mergedRef}
        type="button"
        aria-expanded={open}
        onClick={(e) => {
          onClick?.(e);
          setOpen?.(!open);
        }}
        {...props}
      />
    );
  }
);

const PopoverClose = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  function PopoverClose({ onClick, ...props }: React.ComponentPropsWithoutRef<'button'>, ref: React.Ref<HTMLButtonElement>) {
    const { setOpen } = usePopoverContext();
    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          onClick?.(e);
          setOpen?.(false);
        }}
        {...props}
      />
    );
  }
);

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(function PopoverContent({ className, children, ...props }, ref) {
  const { open, contentRef } = usePopoverContext();
  const mergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof contentRef === 'function') contentRef(node);
      else if (contentRef) contentRef.current = node;
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [contentRef, ref]
  );

  if (!open) return null;

  // Render directly to document.body to break stacking context
  return React.createElement(Portal, null,
    React.createElement('div', {
      ref: mergedRef,
      className: cn(
        'z-50 min-w-[16rem] rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-[var(--shadow-soft)] outline-none backdrop-blur-md',
        className
      ),
      ...props,
    }, children)
  );
});

function Portal({ children }: { children: React.ReactNode }) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('data-popover-portal', '');
    document.body.appendChild(el);
    setContainer(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  return container ? React.createPortal(children, container) : null;
}

export { Popover, PopoverClose, PopoverContent, PopoverTrigger };
