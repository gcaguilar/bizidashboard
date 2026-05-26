'use client';

import { Link, useLocation } from '@tanstack/react-router';
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

  const linkClassName = `${
    className ?? ''
  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]`.trim();
  const shouldUseNativeNavigation =
    !href ||
    href.startsWith('/api/') ||
    /\.(?:csv|json|txt|xml|pdf|zip)(?:[?#].*)?$/i.test(href) ||
    /^[a-z][a-z0-9+.-]*:/i.test(href);

  if (shouldUseNativeNavigation) {
    return (
      <a href={href} onClick={handleClick} className={linkClassName}>
        {children}
      </a>
    );
  }

  const [internalPath, queryString = ''] = href.split('?');
  const explicitSearch = Object.fromEntries(new URLSearchParams(queryString));

  return (
    <Link
      to={internalPath}
      search={queryString ? explicitSearch : {}}
      onClick={handleClick}
      className={linkClassName}
    >
      {children}
    </Link>
  );
}
