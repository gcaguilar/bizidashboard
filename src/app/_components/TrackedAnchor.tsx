'use client';

import { useLocation } from '@tanstack/react-router';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import {
  buildCtaClickEvent,
  buildEntitySelectEvent,
  buildLegacyInteractionEvent,
  buildNavigationClickEvent,
  resolveRouteKeyFromPathname,
  trackEvent,
  type CtaClickInput,
  type EntitySelectInput,
  type LegacyAnalyticsInteractionName,
  type NavigationClickInput,
  type AnalyticsEventValue,
  type AnalyticsTrackedEvent,
} from '@/lib/analytics';

type TrackedAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  trackingEvent?: AnalyticsTrackedEvent;
  navigationEvent?: Omit<NavigationClickInput, 'surface' | 'routeKey'>;
  ctaEvent?: Omit<CtaClickInput, 'surface' | 'routeKey'>;
  entitySelectEvent?: Omit<EntitySelectInput, 'surface' | 'routeKey'>;
  eventName?: LegacyAnalyticsInteractionName;
  eventData?: Record<string, AnalyticsEventValue>;
};

export function TrackedAnchor({
  children,
  ctaEvent,
  entitySelectEvent,
  eventName,
  eventData,
  navigationEvent,
  trackingEvent,
  onClick,
  className,
  ...anchorProps
}: TrackedAnchorProps) {
  const pathname = useLocation().pathname;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const surface = pathname?.startsWith('/dashboard') ? 'dashboard' : 'public';
    const routeKey = resolveRouteKeyFromPathname(pathname);

    if (trackingEvent) {
      trackEvent(trackingEvent);
    } else if (navigationEvent) {
      trackEvent(
        buildNavigationClickEvent({
          surface,
          routeKey,
          ...navigationEvent,
        })
      );
    } else if (ctaEvent) {
      trackEvent(
        buildCtaClickEvent({
          surface,
          routeKey,
          ...ctaEvent,
        })
      );
    } else if (entitySelectEvent) {
      trackEvent(
        buildEntitySelectEvent({
          surface,
          routeKey,
          ...entitySelectEvent,
        })
      );
    } else if (eventName) {
      trackEvent(
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
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]`.trim()}
    >
      {children}
    </a>
  );
}
