import * as React from 'react';
import { cn } from '@/lib/utils';

type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children: React.ReactElement;
};

export const Slot = React.forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, className, ...props },
  _forwardedRef
) {
  void _forwardedRef;
  const child = React.Children.only(children) as React.ReactElement<Record<string, unknown>>;
  const childProps = child.props as { className?: string };

  return React.cloneElement(child, {
    ...props,
    ...childProps,
    className: cn(className, childProps.className),
  } as Record<string, unknown>);
});
