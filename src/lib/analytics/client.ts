/**
 * PostHog lifecycle. The SDK is imported only after the visitor grants
 * analytics consent, and every capture is guarded again at send time.
 */

import type { CaptureResult, PostHog, PostHogConfig } from 'posthog-js';
import type { PostHogRuntimeConfig } from './config';
import { readAnalyticsConsent } from './consent';
import { sanitizeAnalyticsPayload, type AnalyticsTrackedEvent } from './events';

type MutableCaptureResult = {
  event: string;
  properties?: Record<string, unknown>;
  $set?: Record<string, unknown>;
  $set_once?: Record<string, unknown>;
};

const DENIED_PROPERTY_KEYS = new Set([
  'q',
  'query',
  'search',
  'input',
  'value',
  'email',
  'e-mail',
  'password',
  'passwd',
  'phone',
  'telephone',
  'mobile',
  'token',
  'secret',
  'api_key',
  'apikey',
  'authorization',
  'credit_card',
  'card_number',
  'nif',
  'nie',
  'dni',
  'address',
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SANITIZE_DEPTH = 5;

let client: PostHog | null = null;
let initPromise: Promise<PostHog | null> | null = null;

function isUrlProperty(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower.includes('url') ||
    lower.includes('href') ||
    lower.endsWith('referrer') ||
    lower.startsWith('$initial_ref')
  );
}

/** Keeps origin + path, drops query strings, fragments and userinfo. */
export function sanitizeUrl(value: string): string {
  try {
    const url = new URL(value, 'http://datosbizi.local');
    const origin = url.origin === 'http://datosbizi.local' ? '' : url.origin;
    return `${origin}${url.pathname}`;
  } catch {
    return '';
  }
}

function sanitizeValue(key: string, value: unknown, depth: number): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    if (EMAIL_PATTERN.test(value.trim())) {
      return undefined;
    }
    return isUrlProperty(key) ? sanitizeUrl(value) : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (depth >= MAX_SANITIZE_DEPTH) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(key, entry, depth + 1)).filter((entry) => entry !== undefined);
  }

  if (typeof value === 'object') {
    return sanitizeProperties(value as Record<string, unknown>, depth + 1);
  }

  return undefined;
}

function sanitizeProperties(properties: Record<string, unknown> | undefined, depth = 0): Record<string, unknown> | undefined {
  if (!properties) {
    return undefined;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (DENIED_PROPERTY_KEYS.has(key.toLowerCase())) {
      continue;
    }
    const next = sanitizeValue(key, value, depth);
    if (next !== undefined) {
      sanitized[key] = next;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

/** Final redaction barrier applied by the SDK immediately before delivery. */
export function sanitizeCaptureResult(event: CaptureResult): CaptureResult | null {
  const mutable = event as unknown as MutableCaptureResult;
  mutable.properties = sanitizeProperties(mutable.properties) ?? {};
  mutable.properties.$geoip_disable = true;

  if (mutable.$set) {
    mutable.$set = sanitizeProperties(mutable.$set) ?? {};
  }
  if (mutable.$set_once) {
    mutable.$set_once = sanitizeProperties(mutable.$set_once) ?? {};
  }

  return event;
}

function buildPostHogConfig(runtime: PostHogRuntimeConfig): Partial<PostHogConfig> {
  return {
    api_host: runtime.host,
    ui_host: runtime.uiHost,
    defaults: '2026-08-30',
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    rageclick: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_flags: true,
    person_profiles: 'never',
    opt_out_capturing_by_default: true,
    persistence: 'localStorage',
    debug: false,
    before_send: sanitizeCaptureResult,
  };
}

function clearPostHogPersistence(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const isPostHogKey = (key: string) => {
    const lower = key.toLowerCase();
    return lower.includes('posthog') || lower.startsWith('ph_');
  };

  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      const keys = Array.from({ length: store.length }, (_, index) => store.key(index));
      for (const key of keys) {
        if (key && isPostHogKey(key)) {
          store.removeItem(key);
        }
      }
    } catch {
      // Storage may be blocked; opt-out still prevents further captures.
    }
  }

  try {
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0]?.trim();
      if (name && isPostHogKey(name)) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    }
  } catch {
    // Ignore cookie access failures.
  }
}

export function isAnalyticsClientReady(): boolean {
  return client !== null;
}

export async function initAnalytics(runtime: PostHogRuntimeConfig): Promise<PostHog | null> {
  if (typeof window === 'undefined' || readAnalyticsConsent() !== 'granted') {
    return null;
  }

  if (client) {
    return client;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const { default: posthog } = await import('posthog-js');

      // Consent can be revoked while the chunk is loading.
      if (readAnalyticsConsent() !== 'granted') {
        return null;
      }

      posthog.init(runtime.key, buildPostHogConfig(runtime));
      posthog.opt_in_capturing();
      client = posthog;
      return posthog;
    } catch {
      client = null;
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export function revokeAnalytics(): void {
  if (client) {
    try {
      client.opt_out_capturing();
      client.reset(true);
    } catch {
      // Best effort: the consent flag already blocks future trackEvent calls.
    }
  }

  client = null;
  initPromise = null;
  clearPostHogPersistence();
}

export function trackEvent(event: AnalyticsTrackedEvent): void {
  if (typeof window === 'undefined' || readAnalyticsConsent() !== 'granted') {
    return;
  }

  const payload = sanitizeAnalyticsPayload(event.payload);

  if (client && !client.has_opted_out_capturing()) {
    client.capture(event.name, payload);
    return;
  }

  // Only events emitted after consent may wait for the lazy SDK chunk.
  if (initPromise) {
    void initPromise.then((instance) => {
      if (
        instance &&
        readAnalyticsConsent() === 'granted' &&
        !instance.has_opted_out_capturing()
      ) {
        instance.capture(event.name, payload);
      }
    });
  }
}
