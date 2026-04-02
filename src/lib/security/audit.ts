import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { hashSensitiveValue } from '@/lib/security/http';

export type SecurityEventInput = {
  eventType: string;
  route: string;
  requestId: string;
  outcome: string;
  reasonCode?: string | null;
  installId?: string | null;
  collectionId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function recordSecurityEvent(input: SecurityEventInput): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        eventType: input.eventType,
        route: input.route,
        requestId: input.requestId,
        installId: input.installId ?? null,
        collectionId: input.collectionId ?? null,
        ipHash: hashSensitiveValue(input.ip),
        userAgentHash: hashSensitiveValue(input.userAgent),
        outcome: input.outcome,
        reasonCode: input.reasonCode ?? null,
        metadata: input.metadata ?? null,
      },
    });
  } catch (error) {
    logger.warn('security_event.persist_failed', {
      route: input.route,
      eventType: input.eventType,
      error,
    });
  }
}

export async function getSecurityEventSummary(hours = 24): Promise<{
  failedAuthLast24Hours: number;
  rateLimitedLast24Hours: number;
  refreshTokenReuseLast24Hours: number;
}> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  try {
    const [failedAuthLast24Hours, rateLimitedLast24Hours, refreshTokenReuseLast24Hours] =
      await Promise.all([
        prisma.securityEvent.count({
          where: {
            createdAt: { gte: since },
            outcome: 'denied',
            eventType: {
              in: ['auth_failed', 'signature_invalid', 'token_reuse_detected'],
            },
          },
        }),
        prisma.securityEvent.count({
          where: {
            createdAt: { gte: since },
            eventType: 'rate_limit_exceeded',
          },
        }),
        prisma.securityEvent.count({
          where: {
            createdAt: { gte: since },
            eventType: 'token_reuse_detected',
          },
        }),
      ]);

    return {
      failedAuthLast24Hours,
      rateLimitedLast24Hours,
      refreshTokenReuseLast24Hours,
    };
  } catch (error) {
    logger.warn('security_event.summary_failed', { error });
    return {
      failedAuthLast24Hours: 0,
      rateLimitedLast24Hours: 0,
      refreshTokenReuseLast24Hours: 0,
    };
  }
}

