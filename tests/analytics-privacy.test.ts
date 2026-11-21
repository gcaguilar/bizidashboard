// @vitest-environment jsdom

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ANALYTICS_EVENT_CATALOG,
  sanitizeAnalyticsPayload,
  sanitizeCaptureResult,
  sanitizeUrl,
} from '@/lib/analytics';
import type { PostHogRuntimeConfig } from '@/lib/analytics/config';
import { writeAnalyticsConsent } from '@/lib/analytics/consent';

const { posthogMock } = vi.hoisted(() => ({
  posthogMock: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    alias: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
    reset: vi.fn(),
    has_opted_out_capturing: vi.fn(() => false),
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

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(full);
    }
    return entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') ? [full] : [];
  });
}

describe('analytics privacy lockdown', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const fn of [
      posthogMock.init,
      posthogMock.capture,
      posthogMock.identify,
      posthogMock.alias,
      posthogMock.opt_in_capturing,
      posthogMock.opt_out_capturing,
      posthogMock.reset,
    ]) {
      fn.mockReset();
    }
    posthogMock.has_opted_out_capturing.mockReset();
    posthogMock.has_opted_out_capturing.mockReturnValue(false);
  });

  it('keeps the project token but strips person data, secrets and URL params in before_send', () => {
    const event = {
      event: 'public_page_view',
      properties: {
        token: 'phc_project_key',
        surface: 'public',
        route_key: 'explore',
        result_count_bucket: '6_20',
        $current_url: 'https://datosbizi.com/explorar?q=vecino%40correo.com&token=abc#hash',
        $referrer: 'https://example.org/buscar?query=privado',
        email: 'persona@example.com',
        name: 'Persona Example',
        first_name: 'Persona',
        phone: '600000000',
        q: 'vecino particular',
        query: 'texto libre',
        search: 'texto libre',
        input: 'contenido del formulario',
        api_key: 'sk_secret',
        secret: 'sk_secret',
        authorization: 'Bearer abc',
        password: 'hunter2',
        $set: { email: 'persona@example.com', plan: 'free' },
        $set_once: { initial_url: '/informes?sub=secreto' },
        $initial_person_info: { r: 'https://example.org/x?secret=1' },
        $ip: '203.0.113.4',
        nested: {
          email: 'otra@example.com',
          token: 'phc_nested',
          url: 'https://example.com/ruta?x=1',
          safe: 'aggregate_value',
          deep: { phone: '600000000', keep: 'ok' },
        },
        entries: [
          { email: 'tercero@example.com', keep: 'ok' },
          { phone: '600000000', keep: 'also_ok' },
        ],
      },
      $set: { email: 'persona@example.com' },
      $set_once: { phone: '600000000' },
    };

    const result = sanitizeCaptureResult(event as never) as {
      properties: Record<string, unknown>;
      $set?: unknown;
      $set_once?: unknown;
    };

    expect(result).not.toBeNull();
    const properties = result.properties;
    // The SDK's own project key must survive; caller-supplied secrets must not.
    expect(properties.token).toBe('phc_project_key');
    expect(properties.surface).toBe('public');
    expect(properties.route_key).toBe('explore');
    expect(properties.result_count_bucket).toBe('6_20');
    expect(properties.$current_url).toBe('https://datosbizi.com/explorar');
    expect(properties.$referrer).toBe('https://example.org/buscar');
    for (const key of [
      'email', 'name', 'first_name', 'phone', 'q', 'query', 'search', 'input',
      'api_key', 'secret', 'authorization', 'password',
      '$set', '$set_once', '$initial_person_info', '$ip',
    ]) {
      expect(properties[key], `before_send leaked ${key}`).toBeUndefined();
    }
    expect(result.$set).toBeUndefined();
    expect(result.$set_once).toBeUndefined();

    const nested = properties.nested as Record<string, unknown>;
    expect(nested.safe).toBe('aggregate_value');
    expect(nested.email).toBeUndefined();
    expect(nested.token).toBeUndefined();
    expect(nested.url).toBe('https://example.com/ruta');
    expect((nested.deep as Record<string, unknown>).phone).toBeUndefined();
    expect((nested.deep as Record<string, unknown>).keep).toBe('ok');
    expect(properties.entries).toEqual([{ keep: 'ok' }, { keep: 'also_ok' }]);

    const serialized = JSON.stringify(result);
    for (const leak of [
      'persona@example.com', 'otra@example.com', 'tercero@example.com',
      'phc_nested', 'sk_secret', 'hunter2', '600000000', '203.0.113.4',
      '?q=', '?query=', '?x=1', '?sub=secreto',
    ]) {
      expect(serialized, `before_send leaked ${leak}`).not.toContain(leak);
    }
  });

  it('strips query strings, fragments and userinfo from URLs', () => {
    expect(sanitizeUrl('https://datosbizi.com/explorar?q=vecino%40correo.com&token=abc#hash')).toBe(
      'https://datosbizi.com/explorar'
    );
    expect(sanitizeUrl('/dashboard/estaciones/401?edit=1#top')).toBe('/dashboard/estaciones/:id');
    expect(sanitizeUrl('/informes/2026-03?month=2026-03')).toBe('/informes/:month');
    expect(sanitizeUrl('https://datosbizi.com/barrios/17?x=1')).toBe('https://datosbizi.com/barrios/:district');
    expect(sanitizeUrl('https://user:pass@example.com/ruta?x=1')).toBe('https://example.com/ruta');
    expect(sanitizeUrl('http://')).toBe('');
  });

  it('never exposes identity or free-text property names in the event catalog', () => {
    const forbidden = [
      'email', 'e-mail', 'name', 'first_name', 'last_name', 'phone', 'mobile',
      'query', 'search', 'input', 'value', 'text', 'token', 'secret', 'password',
      'api_key', 'station_id', 'entity_id', 'user_id', 'path', 'url',
      '$set', '$set_once', '$ip',
    ];
    for (const definition of Object.values(ANALYTICS_EVENT_CATALOG)) {
      for (const key of forbidden) {
        expect(definition.allowedProperties, `${definition.name}: ${key}`).not.toContain(key);
      }
    }

    expect(
      sanitizeAnalyticsPayload({
        email: 'persona@example.com',
        phone: '600000000',
        token: 'phc_secret',
        query: 'texto libre',
      })
    ).toBeUndefined();
  });

  it('never asks the SDK to identify or alias a person, and disables invasive capture', async () => {
    writeAnalyticsConsent('granted');
    const client = await loadClient();
    await client.initAnalytics(runtime);

    client.trackEvent({
      name: 'search_submit',
      payload: {
        surface: 'public',
        route_key: 'explore',
        source: 'public_search',
        query_present: true,
        query_length_bucket: '3_5',
        email: 'persona@example.com',
        query: 'texto libre',
        token: 'phc_secret',
      } as never,
    });

    expect(posthogMock.identify).not.toHaveBeenCalled();
    expect(posthogMock.alias).not.toHaveBeenCalled();
    expect(posthogMock.capture).toHaveBeenCalledWith('search_submit', {
      surface: 'public',
      route_key: 'explore',
      source: 'public_search',
      query_present: true,
      query_length_bucket: '3_5',
    });

    const [key, config] = posthogMock.init.mock.calls[0] as [string, Record<string, unknown>];
    expect(key).toBe('ph_test');
    expect(config.autocapture).toBe(false);
    expect(config.capture_heatmaps).toBe(false);
    expect(config.disable_session_recording).toBe(true);
    expect(config.disable_surveys).toBe(true);
    expect(config.capture_exceptions).toBe(false);
    expect(config.rageclick).toBe(false);
    expect(config.capture_dead_clicks).toBe(false);
    expect(config.capture_performance).toBe(false);
    expect(config.advanced_disable_flags).toBe(true);
    expect(config.save_campaign_params).toBe(false);
    expect(config.save_referrer).toBe(false);
    expect(config.person_profiles).toBe('never');
    expect(config.capture_pageview).toBe('history_change');
    expect(config.capture_pageleave).toBe('if_capture_pageview');
    expect(typeof config.before_send).toBe('function');

    // `vi.resetModules()` re-evaluates client.ts, so compare behavior, not identity.
    const beforeSend = config.before_send as (event: unknown) => {
      properties: Record<string, unknown>;
    };
    const redacted = beforeSend({
      event: 'public_page_view',
      properties: { token: 'phc_project_key', email: 'persona@example.com', $set: { plan: 'free' } },
    });
    expect(redacted.properties.token).toBe('phc_project_key');
    expect(redacted.properties.email).toBeUndefined();
    expect(redacted.properties.$set).toBeUndefined();
  });

  it('has no identify call anywhere in the application source', () => {
    const files = sourceFiles(join(process.cwd(), 'src'));
    expect(files.length).toBeGreaterThan(0);

    const offenders = files.filter((file) => /\bidentify\s*\(/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
