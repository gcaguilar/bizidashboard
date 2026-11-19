/**
 * First-party analytics consent. Non-essential analytics stays off until the
 * visitor explicitly grants consent; the choice survives reloads and can be
 * revoked at any time.
 */

export type AnalyticsConsentChoice = 'granted' | 'denied';
export type AnalyticsConsent = 'unknown' | AnalyticsConsentChoice;

export const ANALYTICS_CONSENT_STORAGE_KEY = 'bizidashboard:analytics-consent:v1';
export const ANALYTICS_CONSENT_EVENT = 'datosbizi:analytics-consent-change';
export const ANALYTICS_PREFERENCES_EVENT = 'datosbizi:open-analytics-preferences';

export function parseAnalyticsConsent(raw: string | null | undefined): AnalyticsConsent {
  return raw === 'granted' || raw === 'denied' ? raw : 'unknown';
}

export function readAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  try {
    return parseAnalyticsConsent(window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY));
  } catch {
    return 'unknown';
  }
}

export function writeAnalyticsConsent(choice: AnalyticsConsentChoice): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, choice);
  } catch {
    // Storage may be unavailable (private mode); keep the in-memory choice.
  }

  window.dispatchEvent(
    new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: { consent: choice } }),
  );
}

type ConsentListener = (consent: AnalyticsConsentChoice) => void;

function choiceFromEvent(event: Event): AnalyticsConsentChoice | null {
  if (event instanceof CustomEvent) {
    const detail = event.detail as { consent?: unknown } | null;
    if (detail?.consent === 'granted' || detail?.consent === 'denied') {
      return detail.consent;
    }
  }

  if (event.type === 'storage') {
    const storageEvent = event as StorageEvent;
    if (storageEvent.key === ANALYTICS_CONSENT_STORAGE_KEY) {
      return parseAnalyticsConsent(storageEvent.newValue) === 'unknown'
        ? null
        : (parseAnalyticsConsent(storageEvent.newValue) as AnalyticsConsentChoice);
    }
  }

  return null;
}

export function openAnalyticsPreferences(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(ANALYTICS_PREFERENCES_EVENT));
}

export function subscribeToAnalyticsPreferences(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  window.addEventListener(ANALYTICS_PREFERENCES_EVENT, listener);
  return () => window.removeEventListener(ANALYTICS_PREFERENCES_EVENT, listener);
}

export function subscribeToAnalyticsConsent(listener: ConsentListener): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: Event) => {
    const choice = choiceFromEvent(event);
    if (choice) {
      listener(choice);
    }
  };

  window.addEventListener(ANALYTICS_CONSENT_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(ANALYTICS_CONSENT_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
