import * as Sentry from '@sentry/nextjs';
import { parseSentrySampleRate } from '@/lib/sentry-config';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),

  tracesSampleRate: parseSentrySampleRate(process.env.NEXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE, 0.2),
  debug: false,

  replaysOnErrorSampleRate: parseSentrySampleRate(
    process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
    1.0
  ),
  replaysSessionSampleRate: parseSentrySampleRate(
    process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
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
