import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  generateAccessToken,
  hashToken,
  issueRefreshToken,
  verifyRefreshToken,
} from '@/lib/auth/jwt';
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

const ACCESS_TOKEN_EXPIRY_SECONDS = 900;
const REFRESH_RATE_LIMIT = {
  limit: 30,
  windowMs: 5 * 60 * 1000,
};

const refreshRequestSchema = z.object({
  refreshToken: z.string().trim().min(20).max(4096),
});

type TokenRefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export async function POST(request: NextRequest): Promise<Response> {
  return withApiRequest(
    request,
    {
      route: '/api/token/refresh',
      routeGroup: 'mobile.auth',
    },
    async ({ requestId, clientIp, userAgent }) => {
      const originRejection = rejectDisallowedMobileOrigin(request);
      if (originRejection) {
        return originRejection;
      }

      const body = await request.json().catch(() => null);
      const parsed = refreshRequestSchema.safeParse(body);
      const tokenFingerprint = parsed.success ? hashToken(parsed.data.refreshToken) : 'invalid-body';

      const [ipDecision, tokenDecision] = await Promise.all([
        consumeRateLimit({
          namespace: 'token-refresh:ip',
          identifierParts: [clientIp],
          limit: REFRESH_RATE_LIMIT.limit,
          windowMs: REFRESH_RATE_LIMIT.windowMs,
        }),
        consumeRateLimit({
          namespace: 'token-refresh:token',
          identifierParts: [tokenFingerprint],
          limit: REFRESH_RATE_LIMIT.limit,
          windowMs: REFRESH_RATE_LIMIT.windowMs,
        }),
      ]);

      const rateLimitDecision = !ipDecision.allowed ? ipDecision : tokenDecision;
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
          route: '/api/token/refresh',
          requestId,
          ip: clientIp,
          userAgent,
          outcome: 'denied',
          reasonCode: 'rate_limit',
        });

        return NextResponse.json(
          { error: 'Too many refresh attempts' },
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
        return NextResponse.json(
          {
            error: 'Invalid request payload',
            details: parsed.error.flatten(),
          },
          { status: 400, headers: baseHeaders }
        );
      }

      try {
        const payload = await verifyRefreshToken(parsed.data.refreshToken);
        if (!payload?.installId) {
          await recordSecurityEvent({
            eventType: 'auth_failed',
            route: '/api/token/refresh',
            requestId,
            ip: clientIp,
            userAgent,
            outcome: 'denied',
            reasonCode: 'invalid_refresh_token',
          });

          return NextResponse.json(
            { error: 'Invalid or expired refresh token' },
            { status: 401, headers: baseHeaders }
          );
        }

        const install = await prisma.install.findUnique({
          where: { installId: payload.installId },
        });

        if (!install || !install.isActive || install.revokedAt) {
          await recordSecurityEvent({
            eventType: 'auth_failed',
            route: '/api/token/refresh',
            requestId,
            installId: payload.installId,
            ip: clientIp,
            userAgent,
            outcome: 'denied',
            reasonCode: 'install_inactive',
          });

          return NextResponse.json(
            { error: 'Installation not found or inactive' },
            { status: 401, headers: baseHeaders }
          );
        }

        const incomingHash = hashToken(parsed.data.refreshToken);

        if (install.refreshTokenHash !== incomingHash) {
          await prisma.install.update({
            where: { installId: install.installId },
            data: {
              isActive: false,
              revokedAt: new Date(),
            },
          });

          await recordSecurityEvent({
            eventType: 'token_reuse_detected',
            route: '/api/token/refresh',
            requestId,
            installId: install.installId,
            ip: clientIp,
            userAgent,
            outcome: 'denied',
            reasonCode: 'refresh_token_reuse',
          });

          return NextResponse.json(
            { error: 'Refresh token revoked' },
            { status: 401, headers: baseHeaders }
          );
        }

        const [issuedRefreshToken, accessToken] = await Promise.all([
          issueRefreshToken(install.installId),
          generateAccessToken(install.installId),
        ]);

        await prisma.install.update({
          where: { installId: install.installId },
          data: {
            refreshTokenHash: hashToken(issuedRefreshToken.token),
            refreshTokenIssuedAt: issuedRefreshToken.issuedAt,
            lastSeenAt: issuedRefreshToken.issuedAt,
            lastAuthAt: issuedRefreshToken.issuedAt,
            revokedAt: null,
            isActive: true,
          },
        });

        await recordSecurityEvent({
          eventType: 'token_refreshed',
          route: '/api/token/refresh',
          requestId,
          installId: install.installId,
          ip: clientIp,
          userAgent,
          outcome: 'success',
        });

        const response: TokenRefreshResponse = {
          accessToken,
          refreshToken: issuedRefreshToken.token,
          expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
        };

        return NextResponse.json(response, { headers: baseHeaders });
      } catch (error) {
        captureExceptionWithContext(error, {
          area: 'api.token-refresh',
          operation: 'POST /api/token/refresh',
        });
        logger.error('api.token_refresh.failed', { error });
        return NextResponse.json(
          { error: 'Failed to refresh token' },
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
      route: '/api/token/refresh',
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
