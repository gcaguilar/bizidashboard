/**
 * Sentry client-side initialization.
 *
 * Imported as the first import of `src/client.tsx` so the SDK initializes
 * before hydration and captures early errors.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/manual-setup/
 */
import * as Sentry from '@sentry/tanstackstart-react'
import { parseSentrySampleRate } from '@/lib/sentry-config'

// Inlined at build time by Vite. `vite.config.ts` aliases `SENTRY_DSN` into this
// value when `VITE_SENTRY_DSN` is not set, so a single `SENTRY_DSN` configures
// both the browser and the server. (A DSN is a public value.)
const dsn = import.meta.env.VITE_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  // `release` is injected at build time by the Sentry Vite plugin
  // (`__SENTRY_RELEASE__`), so we intentionally don't override it here.
  environment: import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE,

  tracesSampleRate: parseSentrySampleRate(import.meta.env.VITE_SENTRY_TRACE_SAMPLE_RATE, 0.2),
  debug: false,

  // Never attach IP addresses / user identifiers by default. The app already
  // sends hashed request context (see `src/lib/request-context.ts`).
  sendDefaultPii: false,
  dataCollection: {
    userInfo: false,
  },

  // Opt-in structured logs (see `src/lib/logger.ts`).
  enableLogs: import.meta.env.VITE_SENTRY_LOGS_ENABLED === 'true',

  // Client disconnects mid-stream and browser extensions are expected noise.
  ignoreErrors: [
    'AbortError',
    'The connection was closed',
    'ResizeObserver loop completed with undelivered notifications',
  ],
  denyUrls: [/^chrome:\/\//i, /^moz-extension:\/\//i, /^safari-extension:\/\//i, /extensions\//i],

  replaysOnErrorSampleRate: parseSentrySampleRate(
    import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
    1.0
  ),
  replaysSessionSampleRate: parseSentrySampleRate(
    import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
    0.05
  ),

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
