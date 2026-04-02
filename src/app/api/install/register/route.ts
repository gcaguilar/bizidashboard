import { randomUUID } from 'crypto';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { issueRefreshToken, hashPublicKey, hashToken } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { recordSecurityEvent } from '@/lib/security/audit';
import {
  buildMobileCorsHeaders,
  rejectDisallowedMobileOrigin,
  withApiRequest,
} from '@/lib/security/http';
import {
  consumeRateLimit,
  getRateLimitHeaders,
} from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const REGISTER_RATE_LIMIT = {
  limit: 10,
  windowMs: 5 * 60 * 1000,
};

const installRegisterSchema = z.object({
  platform: z.enum(['ios', 'android']),
  appVersion: z.string().trim().min(1).max(256),
  osVersion: z.string().trim().min(1).max(256),
  publicKey: z.string().trim().min(40).max(2048).regex(/^[A-Za-z0-9+/=]+$/),
});

type InstallRegisterResponse = {
  installId: string;
  refreshToken: string;
};

export async function POST(request: NextRequest): Promise<Response> {
  return withApiRequest(
    request,
    {
      route: '/api/install/register',
      routeGroup: 'mobile.auth',
    },
    async ({ requestId, clientIp, userAgent }) => {
      const originRejection = rejectDisallowedMobileOrigin(request);
      if (originRejection) {
        return originRejection;
      }

      const body = await request.json().catch(() => null);
      const parsed = installRegisterSchema.safeParse(body);
      const publicKeyFingerprint = parsed.success
        ? hashPublicKey(parsed.data.publicKey)
        : 'invalid-body';

      const [ipDecision, deviceDecision] = await Promise.all([
        consumeRateLimit({
          namespace: 'install-register:ip',
          identifierParts: [clientIp],
          limit: REGISTER_RATE_LIMIT.limit,
          windowMs: REGISTER_RATE_LIMIT.windowMs,
        }),
        consumeRateLimit({
          namespace: 'install-register:device',
          identifierParts: [publicKeyFingerprint],
          limit: REGISTER_RATE_LIMIT.limit,
          windowMs: REGISTER_RATE_LIMIT.windowMs,
        }),
      ]);
      const rateLimitDecision = !ipDecision.allowed ? ipDecision : deviceDecision;
      const baseHeaders = {
        ...buildMobileCorsHeaders(request),
        ...getRateLimitHeaders(rateLimitDecision),
      };

      if (rateLimitDecision.backend === 'unavailable') {
        return NextResponse.json(
          { error: 'Rate limiting backend unavailable' },
          { status: 503, headers: baseHeaders }
        );
      }

      if (!rateLimitDecision.allowed) {
        await recordSecurityEvent({
          eventType: 'rate_limit_exceeded',
          route: '/api/install/register',
          requestId,
          ip: clientIp,
          userAgent,
          outcome: 'denied',
          reasonCode: 'rate_limit',
          metadata: {
            publicKeyFingerprint,
          },
        });

        return NextResponse.json(
          { error: 'Too many installation registration attempts' },
          {
            status: 429,
            headers: {
              ...baseHeaders,
              'Retry-After': String(rateLimitDecision.retryAfterSeconds),
            },
          }
        );
      }

      if (!parsed.success) {
        await recordSecurityEvent({
          eventType: 'auth_failed',
          route: '/api/install/register',
          requestId,
          ip: clientIp,
          userAgent,
          outcome: 'denied',
          reasonCode: 'validation_failed',
        });

        return NextResponse.json(
          {
            error: 'Invalid request payload',
            details: parsed.error.flatten(),
          },
          { status: 400, headers: baseHeaders }
        );
      }

      try {
        const installId = randomUUID();
        const issuedRefreshToken = await issueRefreshToken(installId);

        await prisma.install.create({
          data: {
            installId,
            platform: parsed.data.platform,
            appVersion: parsed.data.appVersion,
            osVersion: parsed.data.osVersion,
            publicKey: parsed.data.publicKey,
            publicKeyFingerprint,
            refreshTokenHash: hashToken(issuedRefreshToken.token),
            refreshTokenIssuedAt: issuedRefreshToken.issuedAt,
            lastSeenAt: issuedRefreshToken.issuedAt,
            lastAuthAt: issuedRefreshToken.issuedAt,
            isActive: true,
          },
        });

        await recordSecurityEvent({
          eventType: 'install_registered',
          route: '/api/install/register',
          requestId,
          installId,
          ip: clientIp,
          userAgent,
          outcome: 'success',
          metadata: {
            platform: parsed.data.platform,
            appVersion: parsed.data.appVersion,
          },
        });

        const response: InstallRegisterResponse = {
          installId,
          refreshToken: issuedRefreshToken.token,
        };

        return NextResponse.json(response, {
          status: 201,
          headers: baseHeaders,
        });
      } catch (error) {
        captureExceptionWithContext(error, {
          area: 'api.install-register',
          operation: 'POST /api/install/register',
        });
        logger.error('api.install_register.failed', { error });
        return NextResponse.json(
          { error: 'Failed to register installation' },
          { status: 500, headers: baseHeaders }
        );
      }
    }
  );
}

export async function OPTIONS(request: NextRequest): Promise<Response> {
  return withApiRequest(
    request,
    {
      route: '/api/install/register',
      routeGroup: 'mobile.auth',
    },
    async () => {
      const rejection = rejectDisallowedMobileOrigin(request);
      if (rejection) {
        return rejection;
      }

      return new NextResponse(null, {
        status: 204,
        headers: buildMobileCorsHeaders(request),
      });
    }
  );
}
