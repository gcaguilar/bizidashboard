// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  writeAnalyticsConsent,
} from '@/lib/analytics/consent';
import type { PostHogRuntimeConfig } from '@/lib/analytics/config';

const { posthogMock, mockState, trackedUnsubscribes } = vi.hoisted(() => ({
  // Simulates the SDK's sticky `_initialPageviewCaptured` guard: opt_in emits
  // the first pageview, but reset() does not make it emit a second one.
  mockState: { sdkInitialPageviewCaptured: false },
  trackedUnsubscribes: [] as Array<() => void>,
  posthogMock: {
    init: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
    reset: vi.fn(),
    has_opted_out_capturing: vi.fn(() => false),
    capture: vi.fn(),
    identify: vi.fn(),
  },
}));

vi.mock('posthog-js', () => ({ default: posthogMock }));

// Window listeners survive `vi.resetModules()`, so track and detach them after
// every test to keep the single module-level consent listener isolated.
vi.mock('@/lib/analytics/consent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/analytics/consent')>();
  return {
    ...actual,
    subscribeToAnalyticsConsent: (
      listener: Parameters<typeof actual.subscribeToAnalyticsConsent>[0]
    ) => {
      const unsubscribe = actual.subscribeToAnalyticsConsent(listener);
      trackedUnsubscribes.push(unsubscribe);
      return unsubscribe;
    },
  };
});

const runtime: PostHogRuntimeConfig = {
  key: 'ph_test',
  host: 'https://eu.i.posthog.com',
  uiHost: 'https://eu.posthog.com',
};

async function loadClient() {
  vi.resetModules();
  return import('@/lib/analytics/client');
}

function pageviewCalls(): unknown[][] {
  return posthogMock.capture.mock.calls.filter(([name]) => name === '$pageview');
}

describe('PostHog client', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockState.sdkInitialPageviewCaptured = false;
    for (const fn of [
      posthogMock.init,
      posthogMock.opt_in_capturing,
      posthogMock.opt_out_capturing,
      posthogMock.reset,
      posthogMock.capture,
      posthogMock.identify,
    ]) {
      fn.mockReset();
    }
    posthogMock.has_opted_out_capturing.mockReset();
    posthogMock.has_opted_out_capturing.mockReturnValue(false);
    posthogMock.opt_in_capturing.mockImplementation(() => {
      if (!mockState.sdkInitialPageviewCaptured) {
        mockState.sdkInitialPageviewCaptured = true;
        posthogMock.capture('$pageview', { title: '' });
      }
    });
  });

  afterEach(() => {
    while (trackedUnsubscribes.length) {
      trackedUnsubscribes.pop()?.();
    }
  });

  it('never loads the SDK or captures events before a choice (unknown)', async () => {
    const client = await loadClient();

    client.trackEvent({ name: 'public_page_view', payload: { route_key: 'home' } });
    await client.initAnalytics(runtime);

    expect(posthogMock.init).not.toHaveBeenCalled();
    expect(posthogMock.opt_in_capturing).not.toHaveBeenCalled();
    expect(posthogMock.capture).not.toHaveBeenCalled();
  });

  it('never loads the SDK or captures events when consent is denied', async () => {
    writeAnalyticsConsent('denied');
    const client = await loadClient();

    client.trackEvent({ name: 'public_page_view', payload: { route_key: 'home' } });
    await client.initAnalytics(runtime);

    expect(posthogMock.init).not.toHaveBeenCalled();
    expect(posthogMock.capture).not.toHaveBeenCalled();
  });

  it('initializes the EU SDK with all invasive features disabled', async () => {
    writeAnalyticsConsent('granted');
    const client = await loadClient();

    const instance = await client.initAnalytics(runtime);

    expect(instance).toBe(posthogMock);
    expect(posthogMock.init).toHaveBeenCalledTimes(1);
    expect(posthogMock.opt_in_capturing).toHaveBeenCalledWith({ captureEventName: false });
    expect(posthogMock.identify).not.toHaveBeenCalled();

    const [key, config] = posthogMock.init.mock.calls[0] as [string, Record<string, unknown>];
    expect(key).toBe('ph_test');
    expect(config.api_host).toBe('https://eu.i.posthog.com');
    expect(config.ui_host).toBe('https://eu.posthog.com');
    expect(config.autocapture).toBe(false);
    expect(config.capture_pageview).toBe('history_change');
    expect(config.capture_pageleave).toBe('if_capture_pageview');
    expect(config.save_campaign_params).toBe(false);
    expect(config.save_referrer).toBe(false);
    expect(config.capture_dead_clicks).toBe(false);
    expect(config.rageclick).toBe(false);
    expect(config.capture_heatmaps).toBe(false);
    expect(config.capture_performance).toBe(false);
    expect(config.disable_session_recording).toBe(true);
    expect(config.disable_surveys).toBe(true);
    expect(config.logs).toEqual({ captureConsoleLogs: false });
    expect(config.advanced_disable_flags).toBe(true);
    expect(config.person_profiles).toBe('never');
    expect(config.opt_out_capturing_by_default).toBe(true);
    expect(typeof config.before_send).toBe('function');
  });

  it('delegates initial and SPA pageviews to the SDK (history_change)', async () => {
    writeAnalyticsConsent('granted');
    const client = await loadClient();
    await client.initAnalytics(runtime);

    const [, config] = posthogMock.init.mock.calls[0] as [string, Record<string, unknown>];
    // 'history_change' hands both the initial $pageview and every SPA history
    // navigation to posthog-js; there is no manual pageview in application code.
    expect(config.capture_pageview).toBe('history_change');
    expect(pageviewCalls()).toHaveLength(1);
  });

  it('does not initialize twice and emits exactly one initial pageview', async () => {
    writeAnalyticsConsent('granted');
    const client = await loadClient();

    await Promise.all([client.initAnalytics(runtime), client.initAnalytics(runtime)]);

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
    expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(1);
    expect(pageviewCalls()).toHaveLength(1);
  });

  it('captures allowlisted events only after consent', async () => {
    const client = await loadClient();
    client.trackEvent({ name: 'cta_click', payload: { cta_id: 'home_primary' } });
    expect(posthogMock.capture).not.toHaveBeenCalled();

    writeAnalyticsConsent('granted');
    await client.initAnalytics(runtime);
    client.trackEvent({
      name: 'cta_click',
      payload: {
        surface: 'public',
        route_key: 'home',
        cta_id: 'home_primary',
        email: 'x@y.com',
      } as never,
    });

    expect(posthogMock.capture).toHaveBeenCalledWith('cta_click', {
      surface: 'public',
      route_key: 'home',
      cta_id: 'home_primary',
    });
  });

  it('starts the lazy SDK from trackEvent when consent was granted before init', async () => {
    writeAnalyticsConsent('granted');
    const client = await loadClient();
    client.configureAnalytics(runtime);

    // The page trackers' effects run before the consent listener's init settles.
    client.trackEvent({ name: 'public_page_view', payload: { route_key: 'home' } });

    await vi.waitFor(() => {
      expect(posthogMock.init).toHaveBeenCalledTimes(1);
      expect(posthogMock.capture).toHaveBeenCalledWith('public_page_view', { route_key: 'home' });
    });
  });

  it('emits a single $pageview after consent and none without it', async () => {
    const client = await loadClient();
    await client.initAnalytics(runtime);
    expect(posthogMock.capture).not.toHaveBeenCalled();

    writeAnalyticsConsent('granted');
    await client.initAnalytics(runtime);
    await client.initAnalytics(runtime);

    expect(pageviewCalls()).toHaveLength(1);
  });

  it('stops tracking, clears the SDK consent key and resets identity on revoke', async () => {
    writeAnalyticsConsent('granted');
    const client = await loadClient();
    await client.initAnalytics(runtime);
    window.localStorage.setItem('__ph_opt_in_out_ph_test', '1');

    writeAnalyticsConsent('denied');
    client.revokeAnalytics();
    client.trackEvent({ name: 'public_page_view' });

    expect(posthogMock.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.reset).toHaveBeenCalledWith(true);
    expect(pageviewCalls()).toHaveLength(1); // only the initial $pageview
    expect(window.localStorage.getItem('__ph_opt_in_out_ph_test')).toBeNull();
    expect(await client.initAnalytics(runtime)).toBeNull();
  });

  it('re-grants without re-initializing and emits a fresh pageview', async () => {
    writeAnalyticsConsent('granted');
    const client = await loadClient();
    await client.initAnalytics(runtime);

    writeAnalyticsConsent('denied');
    client.revokeAnalytics();
    writeAnalyticsConsent('granted');
    await client.initAnalytics(runtime);

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
    expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(2);
    // The SDK's sticky guard emits the first one; the re-grant path emits one
    // for the current page. No duplicate on either transition.
    expect(pageviewCalls()).toHaveLength(2);
  });

  it('drives the SDK from same-tab and cross-tab consent changes without a banner effect', async () => {
    const client = await loadClient();
    client.configureAnalytics(runtime);
    expect(posthogMock.init).not.toHaveBeenCalled();

    // Same-tab grant.
    writeAnalyticsConsent('granted');
    await vi.waitFor(() => expect(posthogMock.init).toHaveBeenCalledTimes(1));
    expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(1);
    expect(pageviewCalls()).toHaveLength(1);

    // Same-tab revoke.
    writeAnalyticsConsent('denied');
    expect(posthogMock.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(pageviewCalls()).toHaveLength(1);

    // Cross-tab grant: the browser updates localStorage before the event.
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'granted');
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: ANALYTICS_CONSENT_STORAGE_KEY,
        newValue: 'granted',
      })
    );
    await vi.waitFor(() => expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(2));
    expect(posthogMock.init).toHaveBeenCalledTimes(1);
    expect(pageviewCalls()).toHaveLength(2);
  });

  it('redacts URLs and personal values before sending but keeps the token', async () => {
    const client = await loadClient();
    const event = {
      event: 'public_page_view',
      properties: {
        $current_url: 'https://datosbizi.com/explorar?q=vecino%40correo.com&token=abc#hash',
        $referrer: 'https://example.org/buscar?query=privado',
        $pathname: '/estaciones/401',
        $initial_pathname: '/informes/2026-03',
        email: 'persona@example.com',
        token: 'phc_project_key',
        route_key: 'explore',
        $set: { phone: '600000000', plan: 'free' },
        $set_once: { initial_url: '/informes?sub=secreto' },
        $initial_person_info: { r: 'https://example.org/x?secret=1' },
        $ip: '203.0.113.4',
      },
    };

    const result = client.sanitizeCaptureResult(event as never);

    expect(result).not.toBeNull();
    const properties = (result as { properties: Record<string, unknown> }).properties;
    expect(properties.$current_url).toBe('https://datosbizi.com/explorar');
    expect(properties.$referrer).toBe('https://example.org/buscar');
    expect(properties.$pathname).toBe('/estaciones/:id');
    expect(properties.$initial_pathname).toBe('/informes/:month');
    expect(properties.email).toBeUndefined();
    expect(properties.token).toBe('phc_project_key');
    expect(properties.route_key).toBe('explore');
    expect(properties.$set).toBeUndefined();
    expect(properties.$set_once).toBeUndefined();
    expect(properties.$initial_person_info).toBeUndefined();
    expect(properties.$ip).toBeUndefined();
    expect(properties.$geoip_disable).toBeUndefined();
    expect(posthogMock.identify).not.toHaveBeenCalled();
  });

  it('normalizes ID-bearing path segments while leaving ordinary routes intact', async () => {
    const client = await loadClient();

    expect(client.sanitizeUrl('/estaciones/401')).toBe('/estaciones/:id');
    expect(client.sanitizeUrl('/dashboard/estaciones/401')).toBe('/dashboard/estaciones/:id');
    expect(client.sanitizeUrl('/informes/2026-03')).toBe('/informes/:month');
    expect(client.sanitizeUrl('/barrios/central')).toBe('/barrios/:district');
    expect(client.sanitizeUrl('/dashboard/ayuda/intro')).toBe('/dashboard/ayuda/:topic');
    expect(client.sanitizeUrl('/estaciones/401?foo=bar#hash')).toBe('/estaciones/:id');
    expect(client.sanitizeUrl('/explorar')).toBe('/explorar');
    expect(client.sanitizeUrl('/dashboard')).toBe('/dashboard');
  });
});
