'use client';

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { trackUmamiEvent, type UmamiEventValue } from '@/lib/umami';

type TrackedAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  eventName?: string;
  eventData?: Record<string, UmamiEventValue>;
};

export function TrackedAnchor({
  children,
  eventName,
  eventData,
  onClick,
  className,
  ...anchorProps
}: TrackedAnchorProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (eventName) {
      trackUmamiEvent(eventName, eventData);
    }

    onClick?.(event);
  }

  return (
    <a
      {...anchorProps}
      onClick={handleClick}
      className={`${
        className ?? ''
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]`.trim()}
    >
      {children}
    </a>
  );
}
