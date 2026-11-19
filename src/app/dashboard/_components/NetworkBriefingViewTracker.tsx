'use client';

import { useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import {
  buildObservatoryEvent,
  resolveRouteKeyFromPathname,
  trackEvent,
  useAnalyticsConsent,
} from '@/lib/analytics';

export function NetworkBriefingViewTracker() {
  const pathname = useLocation().pathname;
  const consent = useAnalyticsConsent();

  useEffect(() => {
    if (consent !== 'granted') {
      return;
    }
    trackEvent(buildObservatoryEvent('observatory_brief_viewed', {
      surface: pathname.startsWith('/dashboard') ? 'dashboard' : 'public',
      routeKey: resolveRouteKeyFromPathname(pathname),
      source: 'network_briefing',
    }));
  }, [consent, pathname]);
  return null;
}
