import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.SIGNATURE_SECRET = 'test-signature-secret';

const {
  createMock,
  countMock,
} = vi.hoisted(() => ({
  createMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    securityEvent: {
      create: createMock,
      count: countMock,
    },
  },
}));

import { getSecurityEventSummary, recordSecurityEvent } from '@/lib/security/audit';

describe('security audit service', () => {
  beforeEach(() => {
    createMock.mockReset();
    countMock.mockReset();
    createMock.mockResolvedValue({});
  });

  it('hashes IP and user-agent before persisting events', async () => {
    await recordSecurityEvent({
      eventType: 'auth_failed',
      route: '/api/token/refresh',
      requestId: 'req-1',
      outcome: 'denied',
      ip: '198.51.100.10',
      userAgent: 'Vitest',
    });

    const payload = createMock.mock.calls[0]?.[0]?.data;

    expect(payload.ipHash).toHaveLength(64);
    expect(payload.userAgentHash).toHaveLength(64);
    expect(payload.ipHash).not.toBe('198.51.100.10');
  });

  it('aggregates security counts for status summaries', async () => {
    countMock
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);

    const summary = await getSecurityEventSummary();

    expect(summary.failedAuthLast24Hours).toBe(5);
    expect(summary.rateLimitedLast24Hours).toBe(3);
    expect(summary.refreshTokenReuseLast24Hours).toBe(1);
  });
});
