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

    lastTrackedKey.current = trackingKey;

    const track = () => {
      trackEvent(
        buildPublicPageViewEvent({
          routeKey: resolvedRouteKey,
          pageType,
          template,
        })
      );
    };

    if (typeof window.requestIdleCallback === 'function') {
      const idleCallbackId = window.requestIdleCallback(track, { timeout: 2000 });
      return () => window.cancelIdleCallback(idleCallbackId);
    }

    const timeoutId = window.setTimeout(track, 0);
    return () => window.clearTimeout(timeoutId);
  }, [consent, entityId, pageSlug, pageType, pathname, routeKey, template]);

  return null;
}
