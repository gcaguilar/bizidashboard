/**
 * Sentry server-side initialization.
 *
 * Imported for its side effects at the top of the server entry
 * (`src/server.ts`) and the standalone jobs entry (`src/jobs/standalone.ts`).
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/manual-setup/
 */
import * as Sentry from '@sentry/tanstackstart-react'
import { parseSentrySampleRate } from '@/lib/sentry-config'

const dsn = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn) && process.env.NODE_ENV !== 'test',
  release: process.env.GIT_SHA || process.env.SENTRY_DYNACONF_RELEASE,
  environment: process.env.APP_ENV ?? process.env.NODE_ENV,

  tracesSampleRate: parseSentrySampleRate(
    process.env.SENTRY_TRACE_SAMPLE_RATE || process.env.VITE_SENTRY_TRACE_SAMPLE_RATE,
    0.2
  ),

  // The app already records hashed request context; never send raw PII.
  sendDefaultPii: false,

  // Opt-in structured logs (see `src/lib/logger.ts`).
  enableLogs: process.env.SENTRY_LOGS_ENABLED === 'true',

  // Client disconnects mid-stream surface here as SSR-stream AbortErrors and
  // are expected behavior, not server bugs.
  ignoreErrors: ['AbortError', 'The connection was closed'],

  beforeSend(event) {
    if (event.request?.cookies) {
      delete event.request.cookies
    }
    return event
  },
})
