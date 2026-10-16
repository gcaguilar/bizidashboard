/**
 * Sentry server-side initialization.
 *
 * Imported for its side effects at the top of the server entry
 * (`src/server.ts`) and the standalone jobs entry (`src/jobs/standalone.ts`).
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/manual-setup/
 */
import * as Sentry from '@sentry/tanstackstart-react'
import { parseSentrySampleRate, SENTRY_DATA_COLLECTION } from '@/lib/sentry-config'

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

  // Never send raw PII. Sentry v11 removed `sendDefaultPii` and made
  // `dataCollection` collect much more by default, so we restore the
  // restrictive v10 defaults explicitly. The app already records hashed
  // request context.
  dataCollection: SENTRY_DATA_COLLECTION,

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
