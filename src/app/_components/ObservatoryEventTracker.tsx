'use client';
import { useEffect } from 'react';
import {
  buildObservatoryEvent,
  trackEvent,
  useAnalyticsConsent,
  type AnalyticsTrackedEventName,
} from '@/lib/analytics';

export function ObservatoryEventTracker({
  name,
  source,
  routeKey,
}: {
  name: Extract<AnalyticsTrackedEventName, 'comparison_validated_viewed' | 'api_docs_opened'>;
  source: string;
  routeKey: string;
}) {
  const consent = useAnalyticsConsent();

  useEffect(() => {
    if (consent !== 'granted') {
      return;
    }
    trackEvent(buildObservatoryEvent(name, { surface: 'public', routeKey, source }));
  }, [consent, name, routeKey, source]);

  return null;
}
