'use client';

import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import {
  buildLegacyInteractionEvent,
  trackUmamiEvent,
  type LegacyUmamiInteractionName,
  type UmamiEventValue,
  type UmamiTrackedEvent,
} from '@/lib/umami';

type TrackedLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    children: ReactNode;
    trackingEvent?: UmamiTrackedEvent;
    eventName?: LegacyUmamiInteractionName;
    eventData?: Record<string, UmamiEventValue>;
  };

export function TrackedLink({
  children,
  eventName,
  eventData,
  trackingEvent,
  onClick,
  className,
  ...linkProps
}: TrackedLinkProps) {
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
    <Link
      {...linkProps}
      onClick={handleClick}
      className={`${
        className ?? ''
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]`.trim()}
    >
      {children}
    </Link>
  );
}
