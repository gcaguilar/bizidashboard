'use client';

import { useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { buildObservatoryEvent, resolveRouteKeyFromPathname, trackUmamiEvent } from '@/lib/umami';

export function NetworkBriefingViewTracker() {
  const pathname = useLocation().pathname;
  useEffect(() => {
    trackUmamiEvent(buildObservatoryEvent('observatory_brief_viewed', {
      surface: pathname.startsWith('/dashboard') ? 'dashboard' : 'public',
      routeKey: resolveRouteKeyFromPathname(pathname),
      source: 'network_briefing',
    }));
  }, [pathname]);
  return null;
}
