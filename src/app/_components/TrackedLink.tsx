'use client';

import { createLink, Link, useLocation } from '@tanstack/react-router';
import { forwardRef, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react';
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

type TrackingProps = {
  trackingEvent?: AnalyticsTrackedEvent;
  navigationEvent?: Omit<NavigationClickInput, 'surface' | 'routeKey'>;
  ctaEvent?: Omit<CtaClickInput, 'surface' | 'routeKey'>;
  entitySelectEvent?: Omit<EntitySelectInput, 'surface' | 'routeKey'>;
  eventName?: LegacyAnalyticsInteractionName;
  eventData?: Record<string, AnalyticsEventValue>;
};

type TrackedLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children' | 'onClick'> &
  TrackingProps & {
    children: ReactNode;
    href?: string;
    to?: string;
    className?: string;
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  };

/** Emite el evento de Analytics que corresponda antes de delegar en el onClick del consumidor. */
function useTrackedClick(
  tracking: TrackingProps,
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
) {
  const pathname = useLocation().pathname;

  return function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const surface = pathname?.startsWith('/dashboard') ? 'dashboard' : 'public';
    const routeKey = resolveRouteKeyFromPathname(pathname);
    const { trackingEvent, navigationEvent, ctaEvent, entitySelectEvent, eventName, eventData } =
      tracking;

    if (trackingEvent) {
      trackEvent(trackingEvent);
    } else if (navigationEvent) {
      trackEvent(buildNavigationClickEvent({ surface, routeKey, ...navigationEvent }));
    } else if (ctaEvent) {
      trackEvent(buildCtaClickEvent({ surface, routeKey, ...ctaEvent }));
    } else if (entitySelectEvent) {
      trackEvent(buildEntitySelectEvent({ surface, routeKey, ...entitySelectEvent }));
    } else if (eventName) {
      trackEvent(buildLegacyInteractionEvent({ eventName, eventData, pathname }));
    }

    onClick?.(event);
  };
}

const TrackedRouteLinkBase = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement> & TrackingProps
>(function TrackedRouteLinkBase(
  { trackingEvent, navigationEvent, ctaEvent, entitySelectEvent, eventName, eventData, onClick, className, ...anchorProps },
  ref
) {
  const handleClick = useTrackedClick(
    { trackingEvent, navigationEvent, ctaEvent, entitySelectEvent, eventName, eventData },
    onClick
  );

  const linkClassName = `${
    className ?? ''
  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]`.trim();

  return <a ref={ref} onClick={handleClick} className={linkClassName} {...anchorProps} />;
});

/**
 * Variante de TrackedLink con `to`/`params`/`search` validados por el router.
 * Preferible en enlaces nuevos: TrackedLink acepta strings sin comprobar la ruta.
 */
export const TrackedRouteLink = createLink(TrackedRouteLinkBase);

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
  const handleClick = useTrackedClick(
    { trackingEvent, navigationEvent, ctaEvent, entitySelectEvent, eventName, eventData },
    onClick
  );

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
