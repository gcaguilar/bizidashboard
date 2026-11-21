'use client';

import { useLocation } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import {
  buildPublicPageViewEvent,
  resolveRouteKeyFromPathname,
  trackEvent,
  useAnalyticsConsent,
} from '@/lib/analytics';

type PublicPageViewTrackerProps = {
  routeKey?: string;
  pageType: string;
  template: string;
  pageSlug?: string;
  entityId?: string;
};

export function PublicPageViewTracker({
  routeKey,
  pageType,
  template,
  pageSlug,
  entityId,
}: PublicPageViewTrackerProps) {
  const pathname = useLocation().pathname;
  const consent = useAnalyticsConsent();
  const lastTrackedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || consent !== 'granted') {
      return;
    }

    const resolvedRouteKey = routeKey ?? resolveRouteKeyFromPathname(pathname);
    const trackingKey = [
      pathname,
      resolvedRouteKey,
      pageType,
      template,
      pageSlug ?? '',
      entityId ?? '',
    ].join('|');

    if (lastTrackedKey.current === trackingKey) {
      return;
    }

    // Capture synchronously: deferred callbacks can be dropped on fast SPA
    // navigation and desync route_key from $current_url.
    const track = () => {
      lastTrackedKey.current = trackingKey;
      trackEvent(
        buildPublicPageViewEvent({
          routeKey: resolvedRouteKey,
          pageType,
          template,
        })
      );
    };
    track();
  }, [consent, entityId, pageSlug, pageType, pathname, routeKey, template]);

  return null;
}
