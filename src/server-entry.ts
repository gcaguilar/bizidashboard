import * as Sentry from '@sentry/tanstackstart-react'

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  tracesSampleRate: parseFloat(process.env.VITE_SENTRY_TRACE_SAMPLE_RATE || import.meta.env.VITE_SENTRY_TRACE_SAMPLE_RATE || '0.2'),
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
