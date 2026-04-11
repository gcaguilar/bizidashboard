'use client';

import { usePathname } from 'next/navigation';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import {
  buildLegacyInteractionEvent,
  trackUmamiEvent,
  type LegacyUmamiInteractionName,
  type UmamiEventValue,
  type UmamiTrackedEvent,
} from '@/lib/umami';

type TrackedAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  trackingEvent?: UmamiTrackedEvent;
  eventName?: LegacyUmamiInteractionName;
  eventData?: Record<string, UmamiEventValue>;
};

export function TrackedAnchor({
  children,
  eventName,
  eventData,
  trackingEvent,
  onClick,
  className,
  ...anchorProps
}: TrackedAnchorProps) {
  const pathname = usePathname();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (trackingEvent) {
      trackUmamiEvent(trackingEvent);
    } else if (eventName) {
      trackUmamiEvent(
        buildLegacyInteractionEvent({
          eventName,
          eventData,
          pathname,
        })
      );
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
