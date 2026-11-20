'use client';

import { useLocation } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { trackPageview, useAnalyticsConsent } from '@/lib/analytics';

/**
 * Emits one `$pageview` per route change for every page, so PostHog Web
 * Analytics has full coverage regardless of per-page event trackers.
 */
export function PageviewTracker() {
  const pathname = useLocation().pathname;
  const consent = useAnalyticsConsent();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || consent !== 'granted' || lastTrackedPath.current === pathname) {
      return;
    }

    lastTrackedPath.current = pathname;
    trackPageview();
  }, [consent, pathname]);

  return null;
}
