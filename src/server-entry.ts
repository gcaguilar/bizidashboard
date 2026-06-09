import * as Sentry from '@sentry/tanstackstart-react'
import { parseSentrySampleRate } from '@/lib/sentry-config'

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN,
  tracesSampleRate: parseSentrySampleRate(
    process.env.SENTRY_TRACE_SAMPLE_RATE || process.env.VITE_SENTRY_TRACE_SAMPLE_RATE || import.meta.env.VITE_SENTRY_TRACE_SAMPLE_RATE,
    0.2
  ),
  enabled: process.env.NODE_ENV === 'production',
})

export const onRequestError: (error: unknown, request: Request, context?: unknown) => void = (error, request, context) => {
  Sentry.captureException(error, {
    contexts: {
      request: { url: request.url, method: request.method },
      ...(context ? { react: { componentStack: context as string } } : {}),
    },
  });
}
