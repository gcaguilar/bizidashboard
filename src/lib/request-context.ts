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

type ContextStoreLike = {
  getStore: () => ExecutionContext | undefined;
  run: <T>(context: ExecutionContext, callback: () => T) => T;
  enterWith: (context: ExecutionContext) => void;
};

function createFallbackStore(): ContextStoreLike {
  let current: ExecutionContext | undefined;
  return {
    getStore: () => current,
    run: <T>(context: ExecutionContext, callback: () => T): T => {
      const previous = current;
      current = context;
      try {
        return callback();
      } finally {
        current = previous;
      }
    },
    enterWith: (context: ExecutionContext): void => {
      current = context;
    },
  };
}

function createContextStore(): ContextStoreLike {
  if (typeof window !== 'undefined') {
    return createFallbackStore();
  }

  if (typeof process === 'undefined' || typeof process.getBuiltinModule !== 'function') {
    return createFallbackStore();
  }

  try {
    // `process.getBuiltinModule` resolves Node built-ins without a specifier
    // that bundlers statically analyze, so browser/edge bundles never include
    // node:async_hooks.
    const { AsyncLocalStorage } = process.getBuiltinModule('node:async_hooks') as unknown as {
      AsyncLocalStorage: new () => ContextStoreLike;
    };
    return new AsyncLocalStorage();
  } catch {
    return createFallbackStore();
  }
}

const contextStore = createContextStore();

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getExecutionContext(): ExecutionContext | undefined {
  return contextStore.getStore();
}

export function resolveRequestId(headers?: Headers | null): string {
  const incomingId = headers?.get('x-request-id')?.trim();
  return incomingId && incomingId.length > 0 ? incomingId : createRequestId();
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

