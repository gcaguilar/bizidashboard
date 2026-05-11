'use client';

import { useLocation } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import {
  buildPublicPageViewEvent,
  resolveRouteKeyFromPathname,
  trackUmamiEvent,
} from '@/lib/umami';

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
  const lastTrackedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) {
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

    trackUmamiEvent(
      buildPublicPageViewEvent({
        routeKey: resolvedRouteKey,
        pageType,
        template,
      })
    );
  }, [entityId, pageSlug, pageType, pathname, routeKey, template]);

  return null;
}
