'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { DashboardViewMode } from '@/lib/dashboard-modes';
import {
  buildDashboardPageViewEvent,
  resolveRouteKeyFromPathname,
  trackUmamiEvent,
} from '@/lib/umami';

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
  const pathname = usePathname();
  const lastTrackedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const resolvedRouteKey = routeKey ?? resolveRouteKeyFromPathname(pathname);
    const trackingKey = [pathname, resolvedRouteKey, pageType, template, mode ?? ''].join('|');

    if (lastTrackedKey.current === trackingKey) {
      return;
    }

    lastTrackedKey.current = trackingKey;

    trackUmamiEvent(
      buildDashboardPageViewEvent({
        routeKey: resolvedRouteKey,
        pageType,
        template,
        mode,
      })
    );
  }, [mode, pageType, pathname, routeKey, template]);

  return null;
}
