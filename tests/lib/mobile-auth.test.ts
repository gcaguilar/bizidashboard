import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateKeyPairSync, sign } from 'node:crypto';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SIGNATURE_SECRET = 'test-signature-secret-with-32-chars';

const {
  findUniqueMock,
  updateInstallMock,
  recordSecurityEventMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  updateInstallMock: vi.fn(),
  recordSecurityEventMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    install: {
      findUnique: findUniqueMock,
      update: updateInstallMock,
    },
  },
}));

vi.mock('@/lib/security/audit', () => ({
  recordSecurityEvent: recordSecurityEventMock,
}));

import { generateAccessToken } from '@/lib/auth/jwt';
import { verifyMobileRequest } from '@/lib/security/mobile-auth';

const installKeys = generateKeyPairSync('ed25519');
const publicKeyMaterial = installKeys.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

function signedBody(payload: Record<string, unknown>) {
  const body = { ...payload, timestamp: Date.now() };
  const signature = sign(null, Buffer.from(`${body.timestamp}.${JSON.stringify(body)}`), installKeys.privateKey).toString('base64');
  return { ...body, signature };
}

describe('verifyMobileRequest', () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    updateInstallMock.mockReset();
    recordSecurityEventMock.mockReset();
    findUniqueMock.mockResolvedValue({
      installId: 'install-1',
      isActive: true,
      revokedAt: null,
      publicKeyMaterial: publicKeyMaterial,
    });
    updateInstallMock.mockResolvedValue({});
  });

  it('accepts a valid signed mobile request', async () => {
    const accessToken = await generateAccessToken('install-1');
    const body = signedBody({ query: 'Centro' });

    const result = await verifyMobileRequest({
      body: {
        ...body,
        signature: body.signature,
      },
      route: '/api/geo/search',
      request: new Request('http://localhost/api/geo/search', {
        headers: {
          authorization: `Bearer ${accessToken}`,
          'x-installation-id': 'install-1',
        },
      }),
      requestId: 'req-1',
      clientIp: '198.51.100.10',
      userAgent: 'Vitest',
    });

    expect(result.ok).toBe(true);
    expect(updateInstallMock).toHaveBeenCalled();
  });

  it('rejects invalid signatures', async () => {
    const accessToken = await generateAccessToken('install-1');
    const body = signedBody({ query: 'Centro' });

    const result = await verifyMobileRequest({
      body: {
        ...body,
        signature: 'invalid-signature',
      },
      route: '/api/geo/search',
      request: new Request('http://localhost/api/geo/search', {
        headers: {
          authorization: `Bearer ${accessToken}`,
          'x-installation-id': 'install-1',
        },
      }),
      requestId: 'req-2',
      clientIp: '198.51.100.10',
      userAgent: 'Vitest',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it('rejects expired request timestamps', async () => {
    const accessToken = await generateAccessToken('install-1');
    const body = signedBody({ query: 'Centro' });

    const result = await verifyMobileRequest({
      body: {
        ...body,
        timestamp: Date.now() - 6 * 60_000,
        signature: body.signature,
      },
      route: '/api/geo/search',
      request: new Request('http://localhost/api/geo/search', {
        headers: {
          authorization: `Bearer ${accessToken}`,
          'x-installation-id': 'install-1',
        },
      }),
      requestId: 'req-3',
      clientIp: '198.51.100.10',
      userAgent: 'Vitest',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it('requires a body signature regardless of environment flags', async () => {
    process.env.REQUIRE_SIGNED_MOBILE_REQUESTS = 'false';
    const accessToken = await generateAccessToken('install-1');

    const result = await verifyMobileRequest({
      body: { query: 'Centro', timestamp: Date.now() },
      route: '/api/geo/search',
      request: new Request('http://localhost/api/geo/search', {
        headers: {
          authorization: `Bearer ${accessToken}`,
          'x-installation-id': 'install-1',
        },
      }),
      requestId: 'req-4',
      clientIp: '198.51.100.10',
      userAgent: 'Vitest',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      await expect(result.response.json()).resolves.toMatchObject({ details: 'signature_required' });
    }
  });
});
