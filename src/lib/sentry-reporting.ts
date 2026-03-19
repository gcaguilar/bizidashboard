import * as Sentry from '@sentry/nextjs';

type CaptureContext = {
  area: string;
  operation?: string;
  tags?: Record<string, string | number | boolean | null | undefined>;
  extra?: Record<string, unknown>;
};

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error('Unknown non-Error exception');
  }
}

export function captureExceptionWithContext(
  error: unknown,
  context: CaptureContext
): void {
  const exception = toError(error);

  Sentry.withScope((scope) => {
    scope.setTag('area', context.area);

    if (context.operation) {
      scope.setTag('operation', context.operation);
    }

    for (const [key, value] of Object.entries(context.tags ?? {})) {
      if (value !== null && value !== undefined) {
        scope.setTag(key, String(value));
      }
    }

    if (context.extra && Object.keys(context.extra).length > 0) {
      scope.setContext('details', context.extra);
    }

    Sentry.captureException(exception);
  });
}
