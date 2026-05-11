import * as Sentry from '@sentry/tanstackstart-react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: Number(import.meta.env.NEXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE) || 0.2,
  debug: false,
})
