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
  ...anchorProps
}: TrackedAnchorProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (eventName) {
      trackUmamiEvent(eventName, eventData);
    }

    onClick?.(event);
  }

  return (
    <a {...anchorProps} onClick={handleClick}>
      {children}
    </a>
  );
}
