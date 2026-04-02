import * as Sentry from '@sentry/nextjs';
import { getExecutionContext } from '@/lib/request-context';

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
  const executionContext = getExecutionContext();
  scope.setTag('area', context.area);

  if (context.operation) {
    scope.setTag('operation', context.operation);
  }

  if (executionContext?.requestId) {
    scope.setTag('request_id', executionContext.requestId);
  }

  if (executionContext?.routeGroup) {
    scope.setTag('route_group', executionContext.routeGroup);
  }

  if (executionContext?.city) {
    scope.setTag('city', executionContext.city);
  }

  if (executionContext?.installId) {
    scope.setTag('install_id', executionContext.installId);
  }

  if (executionContext?.collectionId) {
    scope.setTag('collection_id', executionContext.collectionId);
  }

  if (executionContext?.trigger) {
    scope.setTag('trigger', executionContext.trigger);
  }

  if (executionContext?.sourceUrl) {
    scope.setTag('source_url', executionContext.sourceUrl);
  }

  if (executionContext?.gbfsVersion) {
    scope.setTag('gbfs_version', executionContext.gbfsVersion);
  }

  if (typeof executionContext?.rateLimited === 'boolean') {
    scope.setTag('rate_limited', executionContext.rateLimited);
  }

  if (executionContext?.cacheBackend) {
    scope.setTag('cache_backend', executionContext.cacheBackend);
  }

  for (const [key, value] of Object.entries(context.tags ?? {})) {
    if (value !== null && value !== undefined) {
      scope.setTag(key, String(value));
    }
  }

  const details = {
    ...(executionContext
      ? {
          requestId: executionContext.requestId,
          route: executionContext.route,
          routeGroup: executionContext.routeGroup,
          city: executionContext.city,
          installId: executionContext.installId,
          collectionId: executionContext.collectionId,
          trigger: executionContext.trigger,
          ipHash: executionContext.ipHash,
          userAgentHash: executionContext.userAgentHash,
        }
      : {}),
    ...(context.extra ?? {}),
  };

  if (Object.keys(details).length > 0) {
    scope.setContext('details', details);
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
