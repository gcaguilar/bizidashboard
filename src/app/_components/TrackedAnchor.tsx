'use client';

import { usePathname } from 'next/navigation';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import {
  buildCtaClickEvent,
  buildLegacyInteractionEvent,
  buildNavigationClickEvent,
  resolveRouteKeyFromPathname,
  trackUmamiEvent,
  type CtaClickInput,
  type LegacyUmamiInteractionName,
  type NavigationClickInput,
  type UmamiEventValue,
  type UmamiTrackedEvent,
} from '@/lib/umami';

type TrackedAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  trackingEvent?: UmamiTrackedEvent;
  navigationEvent?: Omit<NavigationClickInput, 'surface' | 'routeKey'>;
  ctaEvent?: Omit<CtaClickInput, 'surface' | 'routeKey'>;
  eventName?: LegacyUmamiInteractionName;
  eventData?: Record<string, UmamiEventValue>;
};

export function TrackedAnchor({
  children,
  ctaEvent,
  eventName,
  eventData,
  navigationEvent,
  trackingEvent,
  onClick,
  className,
  ...anchorProps
}: TrackedAnchorProps) {
  const pathname = usePathname();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const surface = pathname?.startsWith('/dashboard') ? 'dashboard' : 'public';
    const routeKey = resolveRouteKeyFromPathname(pathname);

    if (trackingEvent) {
      trackUmamiEvent(trackingEvent);
    } else if (navigationEvent) {
      trackUmamiEvent(
        buildNavigationClickEvent({
          surface,
          routeKey,
          ...navigationEvent,
        })
      );
    } else if (ctaEvent) {
      trackUmamiEvent(
        buildCtaClickEvent({
          surface,
          routeKey,
          ...ctaEvent,
        })
      );
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
