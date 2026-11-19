// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_STORAGE_KEY,
  openAnalyticsPreferences,
  parseAnalyticsConsent,
  readAnalyticsConsent,
  subscribeToAnalyticsConsent,
  subscribeToAnalyticsPreferences,
  writeAnalyticsConsent,
} from '@/lib/analytics/consent';

describe('analytics consent', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('treats unknown and malformed values as no decision', () => {
    expect(parseAnalyticsConsent(null)).toBe('unknown');
    expect(parseAnalyticsConsent('yes')).toBe('unknown');
    expect(readAnalyticsConsent()).toBe('unknown');
  });

  it('persists a choice and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAnalyticsConsent(listener);

    writeAnalyticsConsent('granted');

    expect(window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe('granted');
    expect(readAnalyticsConsent()).toBe('granted');
    expect(listener).toHaveBeenCalledWith('granted');
    unsubscribe();
  });

  it('reacts to consent changes made in another tab', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAnalyticsConsent(listener);

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: ANALYTICS_CONSENT_STORAGE_KEY,
        newValue: 'denied',
      })
    );

    expect(listener).toHaveBeenCalledWith('denied');
    unsubscribe();
  });

  it('supports revocation and opening preferences from the footer', () => {
    writeAnalyticsConsent('granted');
    const listener = vi.fn();
    const unsubscribe = subscribeToAnalyticsPreferences(listener);

    writeAnalyticsConsent('denied');
    openAnalyticsPreferences();

    expect(readAnalyticsConsent()).toBe('denied');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('emits a namespaced consent-change event', () => {
    const listener = vi.fn();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, listener);

    writeAnalyticsConsent('denied');

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(ANALYTICS_CONSENT_EVENT, listener);
  });
});
