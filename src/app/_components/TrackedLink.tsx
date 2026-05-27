'use client';

import { Link, useLocation } from '@tanstack/react-router';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
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

type TrackedLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children' | 'onClick'> & {
  children: ReactNode;
  href?: string;
  to?: string;
  trackingEvent?: UmamiTrackedEvent;
  navigationEvent?: Omit<NavigationClickInput, 'surface' | 'routeKey'>;
  ctaEvent?: Omit<CtaClickInput, 'surface' | 'routeKey'>;
  entitySelectEvent?: Omit<EntitySelectInput, 'surface' | 'routeKey'>;
  eventName?: LegacyUmamiInteractionName;
  eventData?: Record<string, UmamiEventValue>;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

function splitInternalDestination(destination: string): {
  to: string;
  search: Record<string, string>;
  hash?: string;
} {
  const url = new URL(destination, 'http://datosbizi.local');

  return {
    to: url.pathname,
    search: Object.fromEntries(url.searchParams),
    hash: url.hash ? url.hash.slice(1) : undefined,
  };
}

export function TrackedLink({
  children,
  href,
  to,
  eventName,
  eventData,
  trackingEvent,
  navigationEvent,
  ctaEvent,
  entitySelectEvent,
  onClick,
  className,
  ...anchorProps
}: TrackedLinkProps) {
  const destination = href ?? to;
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
    !destination ||
    destination.startsWith('//') ||
    !destination.startsWith('/') ||
    destination.startsWith('/api/') ||
    /\.(?:csv|json|txt|xml|pdf|zip)(?:[?#].*)?$/i.test(destination) ||
    /^[a-z][a-z0-9+.-]*:/i.test(destination);

  if (shouldUseNativeNavigation) {
    return (
      <a href={destination} onClick={handleClick} className={linkClassName} {...anchorProps}>
        {children}
      </a>
    );
  }

  const linkDestination = splitInternalDestination(destination);

  return (
    <Link
      to={linkDestination.to}
      search={linkDestination.search}
      hash={linkDestination.hash}
      onClick={handleClick}
      className={linkClassName}
      {...anchorProps}
    >
      {children}
    </Link>
  );
}
