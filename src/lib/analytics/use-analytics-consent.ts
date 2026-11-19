'use client';

import { useSyncExternalStore } from 'react';
import {
  readAnalyticsConsent,
  subscribeToAnalyticsConsent,
  type AnalyticsConsent,
} from './consent';

function subscribe(onChange: () => void): () => void {
  return subscribeToAnalyticsConsent(() => onChange());
}

function getServerSnapshot(): AnalyticsConsent {
  return 'unknown';
}

/** Reactive consent state for components that emit events on mount. */
export function useAnalyticsConsent(): AnalyticsConsent {
  return useSyncExternalStore(subscribe, readAnalyticsConsent, getServerSnapshot);
}
