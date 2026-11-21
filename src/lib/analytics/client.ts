/**
 * PostHog lifecycle. The SDK is imported only after the visitor grants
 * analytics consent, and every capture is guarded again at send time.
 *
 * A single module-level consent listener drives the SDK on both same-tab and
 * cross-tab consent changes. `ConsentBanner` only renders the UI; it does not
 * own any SDK lifecycle effect.
 */

import type { CaptureResult, PostHog, PostHogConfig } from 'posthog-js';
import type { PostHogRuntimeConfig } from './config';
import {
  readAnalyticsConsent,
  subscribeToAnalyticsConsent,
  type AnalyticsConsentChoice,
} from './consent';
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

/**
 * Known ID-bearing route prefixes, longest first. Only the first segment after
 * a prefix is replaced, so Web Analytics keeps popular-page metrics while
 * internal station/report/district identifiers never leave the browser.
 */
const ID_BEARING_PATH_PREFIXES: ReadonlyArray<readonly [string, string]> = [
  ['/dashboard/estaciones/', ':id'],
  ['/dashboard/ayuda/', ':topic'],
  ['/estaciones/', ':id'],
  ['/informes/', ':month'],
  ['/barrios/', ':district'],
];

let client: PostHog | null = null;
/**
 * The `posthog-js` default export is a singleton. Keep a reference after the
 * first init so a revoke/grant cycle can opt back in without calling `init()`
 * a second time on the same instance.
 */
let sdk: PostHog | null = null;
let sdkInitialized = false;
let sdkToken: string | null = null;
let initPromise: Promise<PostHog | null> | null = null;
let runtimeConfig: PostHogRuntimeConfig | null = null;

// Consent → SDK lifecycle state. The listener is attached once and is shared
// by every render; `lastHandledConsent` skips redundant identical events.
let consentListenerActive = false;
let lastHandledConsent: AnalyticsConsentChoice | null = null;
/**
 * `reset()` does not clear the SDK's sticky `_initialPageviewCaptured` guard,
 * so a re-grant needs one explicit pageview for the current page. Cleared as
 * soon as it is emitted.
 */
let needsRegrantPageview = false;

/**
 * Stores the config resolved by the server so `trackEvent` can start the lazy
 * SDK on demand. Callers render this value from the root loader; assigning it
 * during render keeps the config available before any tracker's effect runs.
 * The first call also attaches the single consent listener and reconciles the
 * stored choice (no change event fires for consent persisted from a past load).
 */
export function configureAnalytics(runtime: PostHogRuntimeConfig | null): void {
  const runtimeChanged = runtime !== runtimeConfig;
  runtimeConfig = runtime;

  if (typeof window === 'undefined' || !runtime) {
    return;
  }

  if (!consentListenerActive) {
    subscribeToAnalyticsConsent(handleConsentChange);
    consentListenerActive = true;
  }

  if (runtimeChanged) {
    reconcileCurrentConsent();
  }
}

function applyConsentToSdk(consent: AnalyticsConsentChoice): void {
  if (consent === 'granted') {
    if (runtimeConfig) {
      void initAnalytics(runtimeConfig);
    }
    return;
  }
  revokeAnalytics();
}

function handleConsentChange(consent: AnalyticsConsentChoice): void {
  // Same-tab writes and cross-tab storage events can repeat the same value.
  if (consent === lastHandledConsent) {
    return;
  }
  lastHandledConsent = consent;
  applyConsentToSdk(consent);
}

function reconcileCurrentConsent(): void {
  const consent = readAnalyticsConsent();
  if (consent === 'unknown') {
    return;
  }
  lastHandledConsent = consent;
  applyConsentToSdk(consent);
}

function isUrlProperty(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower.includes('url') ||
    lower.includes('href') ||
    lower.includes('pathname') ||
    lower.endsWith('referrer') ||
    lower.startsWith('$initial_ref')
  );
}

/** Replaces the first ID segment of a known route prefix with a placeholder. */
function normalizePathSegments(path: string): string {
  for (const [prefix, placeholder] of ID_BEARING_PATH_PREFIXES) {
    if (!path.startsWith(prefix)) {
      continue;
    }
    const rest = path.slice(prefix.length);
    const nextSlash = rest.indexOf('/');
    const segment = nextSlash === -1 ? rest : rest.slice(0, nextSlash);
    if (!segment) {
      return path;
    }
    const suffix = nextSlash === -1 ? '' : rest.slice(nextSlash);
    return `${prefix}${placeholder}${suffix}`;
  }
  return path;
}

/** Keeps origin + path, drops query strings, fragments and userinfo. */
export function sanitizeUrl(value: string): string {
  try {
    const url = new URL(value, 'http://datosbizi.local');
    const origin = url.origin === 'http://datosbizi.local' ? '' : url.origin;
    return `${origin}${normalizePathSegments(url.pathname)}`;
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
  // IP-based GeoIP (country/city) is intentional and documented on the privacy
  // page. `ip` is a no-op in posthog-js 1.453, and `$ip` is denylisted above, so
  // no raw IP is ever sent as an event property.
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
    // The SDK is the single owner of `$pageview` (initial + SPA history changes).
    // `if_capture_pageview` keeps `$pageleave` paired with it, as the plan
    // requires, without capturing a leave when no pageview was sent.
    capture_pageview: 'history_change',
    capture_pageleave: 'if_capture_pageview',
    // utm_*/gclid/fbclid/... and referrers are persistent identifiers we do not
    // need; Bizi records only anonymous aggregate navigation data.
    save_campaign_params: false,
    save_referrer: false,
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

function clearSdkConsentKey(): void {
  const token = sdkToken ?? runtimeConfig?.key;
  if (typeof window === 'undefined' || !token) {
    return;
  }

  // posthog-js stores consent under `__ph_opt_in_out_<token>` (localStorage by
  // default). The generic PostHog-key sweep does not match that prefix, so
  // clear it explicitly to make cross-tab opt-out unambiguous.
  const key = `__ph_opt_in_out_${token}`;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage may be blocked; opt-out still prevents further captures.
  }
  try {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
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

  // Remember the token so revoke can clear the SDK's consent key even when the
  // SDK was started lazily by trackEvent rather than by configureAnalytics.
  sdkToken = runtime.key;
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

      // Narrow race: a revoke may land after the import check above but before
      // opting in. Never opt in (or emit a pageview) once consent is gone.
      if (readAnalyticsConsent() !== 'granted') {
        return null;
      }

      // `opt_in_capturing` emits `$opt_in` by default: skip it, it is not part
      // of Bizi's catalog. With `capture_pageview: 'history_change'` the SDK is
      // the single owner of the initial pageview and all SPA pageviews.
      sdk.opt_in_capturing({ captureEventName: false });
      client = sdk;

      if (needsRegrantPageview) {
        // The SDK's internal `_initialPageviewCaptured` guard is not cleared by
        // reset(), so opt_in_capturing() cannot emit again after a revoke. Emit
        // exactly one pageview for the current page here; every later pageview
        // still comes from the SDK's history_autocapture extension.
        client.capture('$pageview');
        needsRegrantPageview = false;
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
  const hadActiveSession = client !== null || sdkInitialized;
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
  clearPostHogPersistence();
  clearSdkConsentKey();
  if (hadActiveSession) {
    needsRegrantPageview = true;
  }

  // SDK limitation: posthog-js's RequestQueue has no disable()/clear(), so
  // opt_out_capturing() stops future captures but cannot cancel events already
  // enqueued for delivery. Those may still flush once; app code can only make
  // sure nothing new is queued (the consent re-checks in initAnalytics and the
  // pending capture below) and clear our own persistence.
}

type CapturePayload = ReturnType<typeof sanitizeAnalyticsPayload>;

function captureWhenReady(name: string, payload: CapturePayload): void {
  if (typeof window === 'undefined' || readAnalyticsConsent() !== 'granted') {
    return;
  }

  // Tracker effects can run before the consent listener's init has settled.
  // Starting the lazy SDK here (and queueing on initPromise below) keeps those
  // events.
  if (!client && !initPromise && runtimeConfig) {
    void initAnalytics(runtimeConfig);
  }

  if (client && !client.has_opted_out_capturing()) {
    client.capture(name, payload);
    return;
  }

  // Only events emitted after consent may wait for the lazy SDK chunk. Re-check
  // consent and opt-out status when the promise settles: a revoke in flight
  // must not let a queued capture through.
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
