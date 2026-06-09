import * as Sentry from '@sentry/tanstackstart-react';
import { validateRuntimeConfiguration } from '@/lib/security/config';

export function register(): void {
  try {
    require('../sentry.server.config');
  } catch {}
  // Not available in this build — optional
  validateRuntimeConfiguration();
}


export const onRequestError: (error: unknown, request: Request, context?: unknown) => void = (error, request, context) => {
  Sentry.captureException(error, {
    contexts: {
      request: { url: request.url, method: request.method },
      ...(context ? { react: { componentStack: context as string } } : {}),
    },
  });
};
