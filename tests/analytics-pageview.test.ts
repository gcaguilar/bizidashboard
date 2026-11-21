// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPublicPageViewEvent } from '@/lib/analytics';
import type { PostHogRuntimeConfig } from '@/lib/analytics/config';
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_STORAGE_KEY,
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from '@/lib/analytics/consent';

const { posthogMock, sdkState } = vi.hoisted(() => ({
  posthogMock: {
    init: vi.fn(),
    capture: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
    reset: vi.fn(),
    has_opted_out_capturing: vi.fn(() => false),
  },
  // posthog-js emits the initial pageview on opt-in and keeps an internal
  // "already captured" guard across reset(). Emulate that so lifecycle tests
  // exercise the integration without loading the real SDK.
  sdkState: { pageviewEmitted: false },
}));

vi.mock('posthog-js', () => ({ default: posthogMock }));

const runtime: PostHogRuntimeConfig = {
  key: 'ph_test',
  host: 'https://eu.i.posthog.com',
  uiHost: 'https://eu.posthog.com',
};

type ListenerEntry = [string, EventListenerOrEventListenerObject];
let registeredListeners: ListenerEntry[] = [];

async function loadClient() {
  vi.resetModules();
  const addSpy = vi.spyOn(window, 'addEventListener');
  const client = await import('@/lib/analytics/client');
  // The root render calls configureAnalytics; it also attaches the module-level
  // consent listener that drives init/revoke on same-tab and cross-tab changes.
  client.configureAnalytics(runtime);
  registeredListeners.push(
    ...addSpy.mock.calls
      .filter(([type]) => type === ANALYTICS_CONSENT_EVENT || type === 'storage')
      .map(([type, listener]) => [type, listener] as ListenerEntry)
  );
  addSpy.mockRestore();
  return client;
}

function clearCookies(): void {
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
}

function pageviews() {
  return posthogMock.capture.mock.calls.filter(([name]) => name === '$pageview');
}

describe('analytics consent lifecycle and SDK-owned pageviews', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    clearCookies();
    sdkState.pageviewEmitted = false;
    for (const fn of [
      posthogMock.init,
      posthogMock.capture,
      posthogMock.opt_in_capturing,
      posthogMock.opt_out_capturing,
      posthogMock.reset,
    ]) {
      fn.mockReset();
    }
    posthogMock.has_opted_out_capturing.mockReset();
    posthogMock.has_opted_out_capturing.mockReturnValue(false);
    posthogMock.opt_in_capturing.mockImplementation(() => {
      if (!sdkState.pageviewEmitted) {
        sdkState.pageviewEmitted = true;
        posthogMock.capture('$pageview');
      }
    });
  });

  afterEach(() => {
    // Each resetModules() creates a fresh client module with its own consent
    // listener. Detach them so stale instances cannot drive the SDK later.
    for (const [type, listener] of registeredListeners) {
      window.removeEventListener(type, listener);
    }
    registeredListeners = [];
  });

  it('neither loads the SDK nor captures anything while consent is unknown', async () => {
    const client = await loadClient();

    expect(readAnalyticsConsent()).toBe('unknown');
    client.trackEvent(buildPublicPageViewEvent({
      routeKey: 'home', pageType: 'home', template: 'home',
    }));
    expect(await client.initAnalytics(runtime)).toBeNull();

    expect(posthogMock.init).not.toHaveBeenCalled();
    expect(posthogMock.capture).not.toHaveBeenCalled();
    expect(posthogMock.opt_in_capturing).not.toHaveBeenCalled();
  });

  it('keeps the SDK dormant when consent is explicitly denied before load', async () => {
    writeAnalyticsConsent('denied');
    const client = await loadClient();

    client.trackEvent({ name: 'public_page_view' });
    expect(await client.initAnalytics(runtime)).toBeNull();

    expect(posthogMock.init).not.toHaveBeenCalled();
    expect(posthogMock.capture).not.toHaveBeenCalled();
    expect(posthogMock.opt_out_capturing).not.toHaveBeenCalled();
  });

  it('captures exactly one initial pageview when consent is granted', async () => {
    const client = await loadClient();
    expect(await client.initAnalytics(runtime)).toBeNull();
    expect(posthogMock.capture).not.toHaveBeenCalled();

    writeAnalyticsConsent('granted');
    await client.initAnalytics(runtime);
    await client.initAnalytics(runtime);

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
    expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.opt_in_capturing).toHaveBeenCalledWith({ captureEventName: false });
    expect(pageviews()).toHaveLength(1);

    const [, config] = posthogMock.init.mock.calls[0] as [string, Record<string, unknown>];
    // The SDK owns pageviews, including SPA history changes and pageleave.
    expect(config.capture_pageview).toBe('history_change');
    expect(config.capture_pageleave).toBe('if_capture_pageview');
  });

  it('never emits a manual $pageview from client trackers on route changes', async () => {
    writeAnalyticsConsent('granted');
    const client = await loadClient();
    await client.initAnalytics(runtime);
    expect(pageviews()).toHaveLength(1);

    // Mount-time trackers emit a custom analytics event, never the SDK's
    // `$pageview`. SPA history changes are handled by the SDK's history patch.
    client.trackEvent(buildPublicPageViewEvent({
      routeKey: 'explore', pageType: 'explore_hub', template: 'explore_hub',
    }));
    client.trackEvent(buildPublicPageViewEvent({
      routeKey: 'monthly_report', pageType: 'report', template: 'monthly_report',
    }));

    expect(pageviews()).toHaveLength(1);
    expect(posthogMock.capture).toHaveBeenCalledWith('public_page_view', {
      surface: 'public',
      route_key: 'explore',
      page_type: 'explore_hub',
      template: 'explore_hub',
    });
    expect(posthogMock.capture).toHaveBeenCalledTimes(3);
  });

  it('opts out, resets the identity and clears SDK storage on revoke', async () => {
    writeAnalyticsConsent('granted');
    const client = await loadClient();
    await client.initAnalytics(runtime);
    expect(pageviews()).toHaveLength(1);

    window.localStorage.setItem('ph_project_key', 'phc_test');
    window.localStorage.setItem('posthog_user', 'persona');
    window.localStorage.setItem('__ph_opt_in_out_ph_test', '1');
    window.sessionStorage.setItem('ph_session', 'session');
    window.sessionStorage.setItem('unrelated', 'keep');
    document.cookie = 'ph_analytics=1; path=/';
    document.cookie = 'unrelated_cookie=keep; path=/';

    writeAnalyticsConsent('denied');

    expect(posthogMock.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.reset).toHaveBeenCalledWith(true);
    expect(window.localStorage.getItem('ph_project_key')).toBeNull();
    expect(window.localStorage.getItem('posthog_user')).toBeNull();
    expect(window.localStorage.getItem('__ph_opt_in_out_ph_test')).toBeNull();
    expect(window.sessionStorage.getItem('ph_session')).toBeNull();
    expect(window.sessionStorage.getItem('unrelated')).toBe('keep');
    expect(document.cookie).not.toContain('ph_analytics');
    expect(document.cookie).toContain('unrelated_cookie=keep');

    client.trackEvent({ name: 'public_page_view' });
    expect(posthogMock.capture).toHaveBeenCalledTimes(1);
    expect(await client.initAnalytics(runtime)).toBeNull();
  });

  it('reacts to a cross-tab storage denial and stops capturing', async () => {
    writeAnalyticsConsent('granted');
    const client = await loadClient();
    await client.initAnalytics(runtime);

    // The module-level consent listener observes `storage` events exactly like
    // same-tab writes, so a denial in another tab revokes this tab's SDK.
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'denied');
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: ANALYTICS_CONSENT_STORAGE_KEY,
        newValue: 'denied',
      })
    );

    expect(readAnalyticsConsent()).toBe('denied');
    expect(posthogMock.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.reset).toHaveBeenCalledWith(true);
    client.trackEvent({ name: 'public_page_view' });
    expect(posthogMock.capture).toHaveBeenCalledTimes(1);
  });

  it('restores the consent choice and capture behaviour after a reload', async () => {
    writeAnalyticsConsent('granted');
    const firstLoad = await loadClient();
    await firstLoad.initAnalytics(runtime);
    expect(pageviews()).toHaveLength(1);

    // A reload re-evaluates both the client module and the SDK singleton; only
    // persisted consent survives.
    sdkState.pageviewEmitted = false;
    posthogMock.capture.mockClear();
    posthogMock.init.mockClear();
    const afterReload = await loadClient();
    expect(readAnalyticsConsent()).toBe('granted');
    expect(await afterReload.initAnalytics(runtime)).not.toBeNull();
    expect(pageviews()).toHaveLength(1);

    posthogMock.capture.mockClear();
    writeAnalyticsConsent('denied');
    const afterSecondReload = await loadClient();
    expect(readAnalyticsConsent()).toBe('denied');
    expect(await afterSecondReload.initAnalytics(runtime)).toBeNull();
    expect(posthogMock.capture).not.toHaveBeenCalled();
  });

  it('re-grants after revoke with a fresh anonymous identity and one new pageview', async () => {
    writeAnalyticsConsent('granted');
    const client = await loadClient();
    await client.initAnalytics(runtime);
    expect(pageviews()).toHaveLength(1);

    writeAnalyticsConsent('denied');
    expect(posthogMock.opt_out_capturing).toHaveBeenCalledTimes(1);
    writeAnalyticsConsent('granted');
    await client.initAnalytics(runtime);
    await client.initAnalytics(runtime);

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
    expect(posthogMock.reset).toHaveBeenCalledWith(true);
    expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(2);
    // The SDK's internal first-pageview guard survives reset(), so the client
    // emits exactly one replacement pageview on re-grant.
    expect(pageviews()).toHaveLength(2);
  });
});
