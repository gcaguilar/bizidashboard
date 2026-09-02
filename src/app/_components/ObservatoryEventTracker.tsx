'use client';
import { useEffect } from 'react';
import { buildObservatoryEvent, trackUmamiEvent, type UmamiTrackedEventName } from '@/lib/umami';
export function ObservatoryEventTracker({ name, source, routeKey }: { name: Extract<UmamiTrackedEventName, 'comparison_validated_viewed' | 'api_docs_opened'>; source: string; routeKey: string }) {
  useEffect(() => { trackUmamiEvent(buildObservatoryEvent(name, { surface: 'public', routeKey, source })); }, [name, routeKey, source]);
  return null;
}
