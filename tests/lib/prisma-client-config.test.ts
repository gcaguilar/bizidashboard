import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  adapterConfigs: [] as Array<Record<string, unknown>>,
  adapterOptions: [] as unknown[],
  prismaOptions: [] as unknown[],
}));

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class {
    constructor(config: Record<string, unknown>, options?: unknown) {
      state.adapterConfigs.push(config);
      state.adapterOptions.push(options);
    }
  },
}));

vi.mock('@/generated/prisma/client', () => ({
  PrismaClient: class {
    constructor(options: unknown) {
      state.prismaOptions.push(options);
    }

    async $connect(): Promise<void> {}

    async $executeRawUnsafe(): Promise<number> {
      return 0;
    }
  },
}));

import { createPostgresPrismaClient } from '@/lib/prisma-client';

describe('createPostgresPrismaClient connection config', () => {
  beforeEach(() => {
    state.adapterConfigs.length = 0;
    state.adapterOptions.length = 0;
    state.prismaOptions.length = 0;
    delete process.env.DATABASE_POOL_MAX;
    delete process.env.DATABASE_STATEMENT_TIMEOUT_MS;
    delete process.env.DATABASE_IDLE_IN_TRANSACTION_TIMEOUT_MS;
  });

  afterEach(() => {
    delete process.env.DATABASE_POOL_MAX;
    delete process.env.DATABASE_STATEMENT_TIMEOUT_MS;
    delete process.env.DATABASE_IDLE_IN_TRANSACTION_TIMEOUT_MS;
  });

  it('sizes the pg pool with the default of 20 connections', async () => {
    await createPostgresPrismaClient({
      databaseUrl: 'postgresql://user:pass@localhost:5432/bizi',
      city: 'zaragoza',
      ensureSchema: false,
    });

    expect(state.adapterConfigs[0]).toMatchObject({ max: 20 });
    expect(state.adapterOptions[0]).toEqual({ schema: 'zaragoza' });
  });

  it('honours DATABASE_POOL_MAX for the adapter pool', async () => {
    process.env.DATABASE_POOL_MAX = '7';

    await createPostgresPrismaClient({
      databaseUrl: 'postgresql://user:pass@localhost:5432/bizi',
      city: 'zaragoza',
      ensureSchema: false,
    });

    expect(state.adapterConfigs[0]).toMatchObject({ max: 7 });
  });

  it('ignores invalid pool sizes and falls back to the default', async () => {
    process.env.DATABASE_POOL_MAX = 'not-a-number';

    await createPostgresPrismaClient({
      databaseUrl: 'postgresql://user:pass@localhost:5432/bizi',
      city: 'zaragoza',
      ensureSchema: false,
    });

    expect(state.adapterConfigs[0]).toMatchObject({ max: 20 });
  });

  it('forwards the server-side statement timeout through libpq options', async () => {
    process.env.DATABASE_STATEMENT_TIMEOUT_MS = '5000';

    await createPostgresPrismaClient({
      databaseUrl: 'postgresql://user:pass@localhost:5432/bizi',
      city: 'zaragoza',
      ensureSchema: false,
    });

    expect(state.adapterConfigs[0].options).toContain('-c statement_timeout=5000');
  });
});
