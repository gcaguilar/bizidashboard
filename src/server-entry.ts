import { init } from '@sentry/tanstackstart-react'

init({
  dsn: process.env.VITE_SENTRY_DSN,
  tracesSampleRate: parseFloat(process.env.VITE_SENTRY_TRACE_SAMPLE_RATE || import.meta.env.VITE_SENTRY_TRACE_SAMPLE_RATE || '0.2'),
  enabled: process.env.NODE_ENV === 'production',
})

export const onRequestError = captureRequestError
