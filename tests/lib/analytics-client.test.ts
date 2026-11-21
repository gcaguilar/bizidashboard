// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { writeAnalyticsConsent } from '@/lib/analytics/consent';
import type { PostHogRuntimeConfig } from '@/lib/analytics/config';

const { posthogMock } = vi.hoisted(() => ({
  posthogMock: {
    init: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
    reset: vi.fn(),
    has_opted_out_capturing: vi.fn(() => false),
    capture: vi.fn(),
  },
}));

vi.mock('posthog-js', () => ({ default: posthogMock }));

const runtime: PostHogRuntimeConfig = {
  key: 'ph_test',
  host: 'https://eu.i.posthog.com',
  uiHost: 'https://eu.posthog.com',
};

async function loadClient() {
  vi.resetModules();
  return import('@/lib/analytics/client');
}

describe('PostHog client', () => {
  beforeEach(() => {
    window.localStorage.clear();
    for (const fn of [
      posthogMock.init,
      posthogMock.opt_in_capturing,
      posthogMock.opt_out_capturing,
      posthogMock.reset,
      posthogMock.capture,
    ]) {
      fn.mockReset();
    }
    posthogMock.has_opted_out_capturing.mockReset();
    posthogMock.has_opted_out_capturing.mockReturnValue(false);
  });

  it('never loads the SDK or captures events before consent', async () => {
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

    const [key, config] = posthogMock.init.mock.calls[0] as [string, Record<string, unknown>];
    expect(key).toBe('ph_test');
    expect(config.api_host).toBe('https://eu.i.posthog.com');
    expect(config.ui_host).toBe('https://eu.posthog.com');
    expect(config.autocapture).toBe(false);
    expect(config.capture_pageview).toBe('history_change');
    expect(config.capture_pageleave).toBe('if_capture_pageview');
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

  it('does not initialize twice', async () => {
    writeAnalyticsConsent('granted');
    const client = await loadClient();

    await Promise.all([client.initAnalytics(runtime), client.initAnalytics(runtime)]);

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
    // The lazy SDK is the only owner of Web Analytics: exactly one initial pageview.
    expect(posthogMock.capture).toHaveBeenCalledTimes(1);
    expect(posthogMock.capture).toHaveBeenCalledWith('$pageview');
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

    // The page trackers' effects run before the consent banner's init effect.
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

    const pageviews = posthogMock.capture.mock.calls.filter(([name]) => name === '$pageview');
    expect(pageviews).toHaveLength(1);
  });

  it('stops tracking and resets identity when consent is revoked', async () => {
    writeAnalyticsConsent('granted');
    const client = await loadClient();
    await client.initAnalytics(runtime);

    writeAnalyticsConsent('denied');
    client.revokeAnalytics();
    client.trackEvent({ name: 'public_page_view' });

    expect(posthogMock.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.reset).toHaveBeenCalledWith(true);
    expect(posthogMock.capture).toHaveBeenCalledTimes(1); // only the initial $pageview
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
    const pageviews = posthogMock.capture.mock.calls.filter(([name]) => name === '$pageview');
    expect(pageviews).toHaveLength(2);
  });

  it('redacts URLs and personal values before sending', async () => {
    const client = await loadClient();
    const event = {
      event: 'public_page_view',
      properties: {
        $current_url: 'https://datosbizi.com/explorar?q=vecino%40correo.com&token=abc#hash',
        $referrer: 'https://example.org/buscar?query=privado',
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
    expect(properties.email).toBeUndefined();
    expect(properties.token).toBe('phc_project_key');
    expect(properties.route_key).toBe('explore');
    expect(properties.$set).toBeUndefined();
    expect(properties.$set_once).toBeUndefined();
    expect(properties.$initial_person_info).toBeUndefined();
    expect(properties.$ip).toBeUndefined();
    expect(properties.$geoip_disable).toBeUndefined();
  });
});
