import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export type ExecutionContext = {
  requestId: string;
  route?: string;
  routeGroup?: string;
  method?: string;
  city?: string;
  installId?: string;
  collectionId?: string;
  trigger?: string;
  sourceUrl?: string;
  gbfsVersion?: string;
  cacheBackend?: string;
  rateLimited?: boolean;
  ipHash?: string | null;
  userAgentHash?: string | null;
};

const contextStore = new AsyncLocalStorage<ExecutionContext>();

export function getExecutionContext(): ExecutionContext | undefined {
  return contextStore.getStore();
}

export function resolveRequestId(headers?: Headers | null): string {
  const incomingId = headers?.get('x-request-id')?.trim();
  return incomingId && incomingId.length > 0 ? incomingId : randomUUID();
}

export function runWithExecutionContext<T>(
  context: ExecutionContext,
  callback: () => T
): T {
  return contextStore.run(context, callback);
}

export function updateExecutionContext(
  patch: Partial<ExecutionContext>
): ExecutionContext | undefined {
  const current = contextStore.getStore();

  if (!current) {
    return undefined;
  }

  const next = {
    ...current,
    ...patch,
  };

  contextStore.enterWith(next);
  return next;
}

