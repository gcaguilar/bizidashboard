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

function isClientAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'AbortError';
  }
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

export const onRequestError: (error: unknown, request: Request, context?: unknown) => void = (error, request, context) => {
  // A client disconnecting mid-stream (closed tab, cancelled navigation) surfaces
  // here as an SSR-stream AbortError. It's expected client behavior, not a server
  // bug, so skip it to avoid drowning real errors in Sentry noise.
  if (isClientAbortError(error)) {
    return;
  }

  Sentry.captureException(error, {
    contexts: {
      request: { url: request.url, method: request.method },
      ...(context ? { react: { componentStack: context as string } } : {}),
    },
  });
}
