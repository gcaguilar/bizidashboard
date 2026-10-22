import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type FakeClient = {
  on: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  quit: ReturnType<typeof vi.fn>;
  handlers: Record<string, (argument?: unknown) => void>;
};

type ModuleState = {
  createdClients: FakeClient[];
  createOptions: Array<Record<string, unknown>>;
  nextConnectFactories: Array<() => Promise<unknown>>;
};

const state = vi.hoisted(() => ({
  createdClients: [] as unknown[],
  createOptions: [] as Array<Record<string, unknown>>,
  nextConnectFactories: [] as Array<() => Promise<unknown>>,
})) as ModuleState;

function makeFakeClient(connectResult: Promise<unknown>): FakeClient {
  const handlers: Record<string, (argument?: unknown) => void> = {};
  const client = {
    on: vi.fn((event: string, handler: (argument?: unknown) => void) => {
      handlers[event] = handler;
      return client;
    }),
    connect: vi.fn(() => connectResult),
    quit: vi.fn(() => Promise.resolve()),
    handlers,
  } as unknown as FakeClient;

  return client;
}

vi.mock('redis', () => ({
  createClient: (options: Record<string, unknown>) => {
    state.createOptions.push(options);
    const connectResult =
      state.nextConnectFactories.length > 0
        ? state.nextConnectFactories.shift()!()
        : Promise.resolve({});
    const client = makeFakeClient(connectResult);
    state.createdClients.push(client);
    return client;
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/sentry-reporting', () => ({
  captureExceptionWithContext: vi.fn(),
  captureWarningWithContext: vi.fn(),
}));

function queueConnectFailure(): void {
  state.nextConnectFactories.push(() => Promise.reject(new Error('redis down')));
}

function queueConnectFactory(factory: () => Promise<unknown>): void {
  state.nextConnectFactories.push(factory);
}

async function importRedisClient() {
  const module = await import('@/lib/cache/redis');
  return module.getRedisClient;
}

describe('getRedisClient resilience', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    state.createdClients.length = 0;
    state.createOptions.length = 0;
    state.nextConnectFactories.length = 0;
    process.env.REDIS_URL = 'redis://test:6379';
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.REDIS_URL;
  });

  it('enables reconnection with backoff and rejects offline queuing', async () => {
    const getRedisClient = await importRedisClient();
    const client = await getRedisClient();

    expect(client).toBe(state.createdClients[0] as unknown);

    expect(state.createOptions[0]).toMatchObject({ disableOfflineQueue: true });
    const socketOptions = state.createOptions[0].socket as {
      reconnectStrategy: (retries: number) => number | false;
    };

    expect(socketOptions.reconnectStrategy(0)).toBe(0);
    expect(socketOptions.reconnectStrategy(1)).toBe(200);
    expect(socketOptions.reconnectStrategy(5)).toBe(1000);
    expect(socketOptions.reconnectStrategy(19)).toBe(3800);
    expect(socketOptions.reconnectStrategy(20)).toBe(false);
    expect(socketOptions.reconnectStrategy(50)).toBe(false);
  });

  it('resets the failure counter after a successful connect', async () => {
    const getRedisClient = await importRedisClient();

    // Un fallo (contador a 1)...
    queueConnectFailure();
    await getRedisClient();
    // ...y una conexión exitosa que resetea el contador a cero.
    queueConnectFactory(() => Promise.resolve({}));
    const recovered = await getRedisClient();
    expect(recovered).toBe(state.createdClients[1] as unknown);
    state.createdClients[1].handlers.ready();

    // El cliente muere (reconexión agotada) y siguen fallando: sin el reset,
    // el contador habría llegado a 3 antes y la puerta se habría cerrado con
    // solo un cliente de repuesto creado.
    state.createdClients[1].handlers.terminated();
    queueConnectFailure();
    await getRedisClient();
    queueConnectFailure();
    await getRedisClient();
    expect(state.createdClients).toHaveLength(4);

    // Ahora sí: tres fallos acumulados cierran la puerta.
    await expect(getRedisClient()).resolves.toBeNull();
    expect(state.createdClients).toHaveLength(4);

    // Tras el cooldown se reintenta en lugar de quedar cerrado para siempre.
    vi.setSystemTime(Date.now() + 31_000);
    queueConnectFactory(() => Promise.resolve({}));
    const afterCooldown = await getRedisClient();
    expect(afterCooldown).toBe(state.createdClients[4] as unknown);
    expect(state.createdClients).toHaveLength(5);
  });

  it('does not hang the caller while the first connect retries', async () => {
    const getRedisClient = await importRedisClient();

    let resolveConnect: (value: unknown) => void = () => {};
    queueConnectFactory(
      () =>
        new Promise((resolve) => {
          resolveConnect = resolve;
        })
    );

    const pending = getRedisClient();
    const settled = vi.fn();
    pending.then(settled);

    await vi.advanceTimersByTimeAsync(2_999);
    expect(settled).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toHaveBeenCalledWith(null);

    // Mientras el intento sigue pendiente, nuevas llamadas fallan rápido.
    await expect(getRedisClient()).resolves.toBeNull();
    expect(state.createdClients).toHaveLength(1);

    // La conexión tardía calienta el cliente en segundo plano.
    resolveConnect({});
    await vi.runAllTimersAsync();
    const warmed = await getRedisClient();
    expect(warmed).toBe(state.createdClients[0] as unknown);
  });

  it('discards a client whose reconnection gave up', async () => {
    const getRedisClient = await importRedisClient();

    queueConnectFactory(() => Promise.resolve({}));
    const first = await getRedisClient();
    expect(first).toBe(state.createdClients[0] as unknown);

    // La reconexión renuncia: el cliente queda muerto y se descarta.
    state.createdClients[0].handlers.terminated();

    queueConnectFactory(() => Promise.resolve({}));
    const second = await getRedisClient();
    expect(second).toBe(state.createdClients[1] as unknown);
    expect(state.createdClients).toHaveLength(2);
  });
});
