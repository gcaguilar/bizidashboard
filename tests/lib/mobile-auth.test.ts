import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SIGNATURE_SECRET = 'test-signature-secret';

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
import { signRequest } from '@/lib/auth/signature';
import { verifyMobileRequest } from '@/lib/security/mobile-auth';

describe('verifyMobileRequest', () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    updateInstallMock.mockReset();
    recordSecurityEventMock.mockReset();
    process.env.REQUIRE_SIGNED_MOBILE_REQUESTS = 'true';

    findUniqueMock.mockResolvedValue({
      installId: 'install-1',
      isActive: true,
      revokedAt: null,
    });
    updateInstallMock.mockResolvedValue({});
  });

  it('accepts a valid signed mobile request', async () => {
    const accessToken = await generateAccessToken('install-1');
    const signed = signRequest({ query: 'Centro' });
    const body = JSON.parse(signed.body) as { query: string; timestamp: number };

    const result = await verifyMobileRequest({
      body: {
        ...body,
        signature: signed.signature,
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
    const signed = signRequest({ query: 'Centro' });
    const body = JSON.parse(signed.body) as { query: string; timestamp: number };

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
    const signed = signRequest({ query: 'Centro' });
    const body = JSON.parse(signed.body) as { query: string; timestamp: number };

    const result = await verifyMobileRequest({
      body: {
        ...body,
        timestamp: Date.now() - 120_000,
        signature: signed.signature,
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
});

