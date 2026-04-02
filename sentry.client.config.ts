import * as Sentry from "@sentry/nextjs";
import { parseSentrySampleRate } from "@/lib/sentry-config";

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

  tracesSampleRate: parseSentrySampleRate(process.env.NEXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE, 0.2),

  debug: false,
});
