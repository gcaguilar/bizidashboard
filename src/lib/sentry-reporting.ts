import * as Sentry from '@sentry/nextjs';

type CaptureContext = {
  area: string;
  operation?: string;
  tags?: Record<string, string | number | boolean | null | undefined>;
  extra?: Record<string, unknown>;
  dedupeKey?: string;
};

type ScopeLike = {
  setTag(key: string, value: string): void;
  setContext(name: string, context: Record<string, unknown> | null): void;
  setLevel(level: 'warning'): void;
};

const capturedMessageKeys = new Set<string>();

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

function applyContext(
  scope: ScopeLike,
  context: CaptureContext
): void {
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
}

function shouldSkipMessageCapture(dedupeKey?: string): boolean {
  if (!dedupeKey) {
    return false;
  }

  if (capturedMessageKeys.has(dedupeKey)) {
    return true;
  }

  capturedMessageKeys.add(dedupeKey);
  return false;
}

export function captureExceptionWithContext(
  error: unknown,
  context: CaptureContext
): void {
  const exception = toError(error);

  Sentry.withScope((scope) => {
    applyContext(scope, context);
    Sentry.captureException(exception);
  });
}

export function captureWarningWithContext(
  message: string,
  context: CaptureContext
): void {
  if (shouldSkipMessageCapture(context.dedupeKey)) {
    return;
  }

  Sentry.withScope((scope) => {
    applyContext(scope, context);
    scope.setLevel('warning');
    Sentry.captureMessage(message, 'warning');
  });
}
