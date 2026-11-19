'use client';

import { useLocation } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import type { DashboardViewMode } from '@/lib/dashboard-modes';
import {
  buildDashboardPageViewEvent,
  resolveRouteKeyFromPathname,
  trackEvent,
  useAnalyticsConsent,
} from '@/lib/analytics';

type DashboardPageViewTrackerProps = {
  routeKey?: string;
  pageType: string;
  template: string;
  mode?: DashboardViewMode;
};

export function DashboardPageViewTracker({
  routeKey,
  pageType,
  template,
  mode,
}: DashboardPageViewTrackerProps) {
  const pathname = useLocation().pathname;
  const consent = useAnalyticsConsent();
  const lastTrackedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || consent !== 'granted') {
      return;
    }

    const resolvedRouteKey = routeKey ?? resolveRouteKeyFromPathname(pathname);
    const trackingKey = [pathname, resolvedRouteKey, pageType, template, mode ?? ''].join('|');

    if (lastTrackedKey.current === trackingKey) {
      return;
    }

    lastTrackedKey.current = trackingKey;

    trackEvent(
      buildDashboardPageViewEvent({
        routeKey: resolvedRouteKey,
        pageType,
        template,
        mode,
      })
    );
  }, [consent, mode, pageType, pathname, routeKey, template]);

  return null;
}
