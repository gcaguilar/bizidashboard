'use client';
import { useEffect } from 'react';
import { buildObservatoryEvent, trackEvent, type AnalyticsTrackedEventName } from '@/lib/analytics';
export function ObservatoryEventTracker({ name, source, routeKey }: { name: Extract<AnalyticsTrackedEventName, 'comparison_validated_viewed' | 'api_docs_opened'>; source: string; routeKey: string }) {
  useEffect(() => { trackEvent(buildObservatoryEvent(name, { surface: 'public', routeKey, source })); }, [name, routeKey, source]);
  return null;
}
