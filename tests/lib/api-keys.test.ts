import { beforeEach, describe, expect, it, vi } from 'vitest';

const { countMock, createMock, findManyMock, findUniqueMock, updateMock } = vi.hoisted(() => ({
  countMock: vi.fn(),
  createMock: vi.fn(),
  findManyMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    apiKey: {
      count: countMock,
      create: createMock,
      findMany: findManyMock,
      findUnique: findUniqueMock,
      update: updateMock,
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import {
  MAX_KEYS_PER_OWNER,
  createOwnApiKey,
  createOwnApiKeyForAccount,
  listApiKeysForAccount,
  revokeOwnApiKeyForAccount,
  validateApiKey,
} from '@/lib/security/api-keys';

const accountId = 'account_global_123';
const otherAccountId = 'account_global_456';

function apiKeyRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'key_123',
    name: 'Analytics script',
    keyHash: 'a'.repeat(64),
    keyPrefix: 'biz_live_abcdefg',
    description: null,
    accountId,
    ownerEmail: 'developer@example.com',
    isActive: true,
    revokedAt: null,
    lastUsedAt: null,
    requestCount: 0,
    createdAt: new Date('2026-08-14T00:00:00.000Z'),
    customRateLimit: null,
    customRateWindow: null,
    ...overrides,
  };
}

describe('API keys owned by global Accounts', () => {
  beforeEach(() => {
    countMock.mockReset();
    createMock.mockReset();
    findManyMock.mockReset();
    findUniqueMock.mockReset();
    updateMock.mockReset();
    updateMock.mockResolvedValue({});
  });

  it('creates account-owned keys with accountId and optional email metadata', async () => {
    countMock.mockResolvedValue(0);
    createMock.mockImplementation(async ({ data }) => apiKeyRecord(data));

    const result = await createOwnApiKeyForAccount({
      name: 'MCP integration',
      accountId,
      ownerEmail: 'developer@example.com',
    });

    expect(result.status).toBe('created');
    if (result.status !== 'created') return;

    expect(result.fullKey).toMatch(/^biz_live_/);
    expect(result.info.accountId).toBe(accountId);
    expect(result.info.ownerEmail).toBe('developer@example.com');
    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accountId,
        ownerEmail: 'developer@example.com',
        createdBy: accountId,
        keyHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    });
    expect(createMock.mock.calls[0]?.[0].data.keyHash).not.toBe(result.fullKey);
  });

  it('enforces the five-key live limit by accountId', async () => {
    countMock.mockResolvedValue(MAX_KEYS_PER_OWNER);

    await expect(
      createOwnApiKeyForAccount({ name: 'One too many', accountId })
    ).resolves.toEqual({ status: 'limit_reached', limit: MAX_KEYS_PER_OWNER });

    expect(countMock).toHaveBeenCalledWith({
      where: { accountId, revokedAt: null, isActive: true },
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it('keeps the legacy email-owned creation flow intact', async () => {
    countMock.mockResolvedValue(0);
    createMock.mockImplementation(async ({ data }) => apiKeyRecord(data));

    const result = await createOwnApiKey('Existing dashboard integration', 'legacy@example.com');

    expect(result.status).toBe('created');
    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accountId: null,
        ownerEmail: 'legacy@example.com',
        createdBy: 'legacy@example.com',
      }),
    });
    expect(countMock).toHaveBeenCalledWith({
      where: { ownerEmail: 'legacy@example.com', revokedAt: null, isActive: true },
    });
  });

  it('lists only active, non-revoked keys for the supplied account', async () => {
    findManyMock.mockResolvedValue([apiKeyRecord()]);

    await expect(listApiKeysForAccount(accountId)).resolves.toMatchObject([
      { id: 'key_123', accountId, ownerEmail: 'developer@example.com' },
    ]);

    expect(findManyMock).toHaveBeenCalledWith({
      where: { accountId, revokedAt: null, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('never uses an email fallback when revoking by account ownership', async () => {
    findUniqueMock.mockResolvedValue(apiKeyRecord({ accountId: null }));

    await expect(revokeOwnApiKeyForAccount('key_123', accountId)).resolves.toBe('not_owner');

    expect(updateMock).not.toHaveBeenCalled();
  });

  it('only lets the owning account revoke a live key', async () => {
    findUniqueMock
      .mockResolvedValueOnce(apiKeyRecord({ accountId: otherAccountId }))
      .mockResolvedValueOnce(apiKeyRecord());

    await expect(revokeOwnApiKeyForAccount('key_123', accountId)).resolves.toBe('not_owner');
    await expect(revokeOwnApiKeyForAccount('key_123', accountId)).resolves.toBe('revoked');

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'key_123' },
      data: {
        isActive: false,
        revokedAt: expect.any(Date),
        revokedReason: 'revoked_by_account_owner',
      },
    });
  });

  it('returns account ownership from validation and keeps usage tracking', async () => {
    const secret = 'biz_live_validation-secret';
    findUniqueMock.mockResolvedValue(apiKeyRecord());

    await expect(validateApiKey(secret)).resolves.toMatchObject({ id: 'key_123', accountId });

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: {
        keyHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      },
      select: expect.objectContaining({ accountId: true }),
    });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'key_123' },
      data: { lastUsedAt: expect.any(Date), requestCount: { increment: 1 } },
    });
  });
});
