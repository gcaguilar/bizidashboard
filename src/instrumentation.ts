import * as Sentry from '@sentry/tanstackstart-react';
import { validateRuntimeConfiguration } from '@/lib/security/config';

export async function register(): Promise<void> {
  await import('../sentry.server.config');
  validateRuntimeConfiguration();
}

/** Server Components / RSC errors (Next.js 15+). */
export const onRequestError = Sentry.captureRequestError;
