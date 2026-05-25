import * as Sentry from '@sentry/tanstackstart-react';
import { parseSentrySampleRate } from '@/lib/sentry-config';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: Boolean(import.meta.env.VITE_SENTRY_DSN),

  tracesSampleRate: parseSentrySampleRate(import.meta.env.VITE_SENTRY_TRACE_SAMPLE_RATE, 0.2),
  debug: false,

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
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
