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
  'name',
  'first_name',
  'last_name',
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
  // SDK properties that may carry person or free-text data. Bizi never sets
  // person properties, so these are dropped at the final barrier too.
  '$set',
  '$set_once',
  '$initial_person_info',
  '$ip',
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SANITIZE_DEPTH = 5;

let client: PostHog | null = null;
/**
 * The `posthog-js` default export is a singleton. Keep a reference after the
 * first init so a revoke/grant cycle can opt back in without calling `init()`
 * a second time on the same instance.
 */
let sdk: PostHog | null = null;
let sdkInitialized = false;
let initialPageviewCaptured = false;
let initPromise: Promise<PostHog | null> | null = null;
let runtimeConfig: PostHogRuntimeConfig | null = null;

/**
 * Stores the config resolved by the server so `trackEvent` can start the lazy
 * SDK on demand. Callers render this value from the root loader; assigning it
 * during render keeps the config available before any tracker's effect runs.
 */
export function configureAnalytics(runtime: PostHogRuntimeConfig | null): void {
  runtimeConfig = runtime;
}

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
  // The SDK stores the project API key in `properties.token`. `token` is on the
  // denylist for caller-supplied data, but dropping the SDK's own key makes
  // PostHog reject every event, so carry it through the redaction untouched.
  const projectToken = mutable.properties?.token;
  mutable.properties = sanitizeProperties(mutable.properties) ?? {};
  if (typeof projectToken === 'string' && projectToken) {
    mutable.properties.token = projectToken;
  }

  // Bizi never sets person properties. Dropping $set/$set_once closes the only
  // path by which a person profile could be enriched from an analytics event.
  delete mutable.$set;
  delete mutable.$set_once;

  return event;
}

function buildPostHogConfig(runtime: PostHogRuntimeConfig): Partial<PostHogConfig> {
  return {
    api_host: runtime.host,
    ui_host: runtime.uiHost,
    defaults: '2026-08-30',
    autocapture: false,
    capture_pageview: 'history_change',
    capture_pageleave: 'if_capture_pageview',
    capture_dead_clicks: false,
    rageclick: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    logs: { captureConsoleLogs: false },
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
      if (!sdk) {
        const { default: posthog } = await import('posthog-js');
        sdk = posthog;
      }

      // Consent can be revoked while the chunk is loading.
      if (readAnalyticsConsent() !== 'granted') {
        return null;
      }

      if (!sdkInitialized) {
        sdk.init(runtime.key, buildPostHogConfig(runtime));
        sdkInitialized = true;
      } else {
        // A previous revoke called reset(), which cleared consent and the
        // identity. Start a fresh anonymous identity before opting back in.
        sdk.reset(true);
      }

      // `opt_in_capturing` emits `$opt_in` by default: skip it, it is not part
      // of Bizi's catalog. The SDK never runs before consent is granted.
      sdk.opt_in_capturing({ captureEventName: false });
      client = sdk;

      // With `opt_out_capturing_by_default`, the SDK's initial pageview is
      // dropped at init time. Capture it once here; later SPA route changes
      // are handled by `capture_pageview: 'history_change'`.
      if (!initialPageviewCaptured) {
        client.capture('$pageview');
        initialPageviewCaptured = true;
      }

      return client;
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
  } else if (sdk && sdkInitialized) {
    // Consent was revoked during the lazy chunk load; no client was assigned
    // yet, but the singleton may already hold an opted-in session.
    try {
      sdk.opt_out_capturing();
      sdk.reset(true);
    } catch {
      // Ignore best-effort cleanup failures.
    }
  }

  client = null;
  initPromise = null;
  initialPageviewCaptured = false;
  clearPostHogPersistence();
}

type CapturePayload = ReturnType<typeof sanitizeAnalyticsPayload>;

function captureWhenReady(name: string, payload: CapturePayload): void {
  if (typeof window === 'undefined' || readAnalyticsConsent() !== 'granted') {
    return;
  }

  // Tracker effects can run before the consent banner's init effect. Starting
  // the lazy SDK here (and queueing on initPromise below) keeps those events.
  if (!client && !initPromise && runtimeConfig) {
    void initAnalytics(runtimeConfig);
  }

  if (client && !client.has_opted_out_capturing()) {
    client.capture(name, payload);
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
        instance.capture(name, payload);
      }
    });
  }
}

export function trackEvent(event: AnalyticsTrackedEvent): void {
  captureWhenReady(event.name, sanitizeAnalyticsPayload(event.payload, event.name));
}

