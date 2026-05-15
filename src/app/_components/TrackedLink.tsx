'use client';

import { Link, useLocation  } from '@tanstack/react-router';
import type { MouseEvent, ReactNode } from 'react';
import {
  buildCtaClickEvent,
  buildEntitySelectEvent,
  buildLegacyInteractionEvent,
  buildNavigationClickEvent,
  resolveRouteKeyFromPathname,
  trackUmamiEvent,
  type CtaClickInput,
  type EntitySelectInput,
  type LegacyUmamiInteractionName,
  type NavigationClickInput,
  type UmamiEventValue,
  type UmamiTrackedEvent,
} from '@/lib/umami';

type TrackedLinkProps = {
  children: ReactNode;
  href?: string;
  trackingEvent?: UmamiTrackedEvent;
  navigationEvent?: Omit<NavigationClickInput, 'surface' | 'routeKey'>;
  ctaEvent?: Omit<CtaClickInput, 'surface' | 'routeKey'>;
  entitySelectEvent?: Omit<EntitySelectInput, 'surface' | 'routeKey'>;
  eventName?: LegacyUmamiInteractionName;
  eventData?: Record<string, UmamiEventValue>;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function TrackedLink({
  children,
  href,
  eventName,
  eventData,
  trackingEvent,
  navigationEvent,
  ctaEvent,
  entitySelectEvent,
  onClick,
  className,
}: TrackedLinkProps) {
  const pathname = useLocation().pathname;
  const to = href;

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
    } else if (entitySelectEvent) {
      trackUmamiEvent(
        buildEntitySelectEvent({
          surface,
          routeKey,
          ...entitySelectEvent,
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
    <Link
      to={to}
      onClick={handleClick}
      className={`${
        className ?? ''
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]`.trim()}
    >
      {children}
    </Link>
  );
}
