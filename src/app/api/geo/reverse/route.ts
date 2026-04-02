import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { reverseGeocode } from '@/lib/geo/nominatim';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { recordSecurityEvent } from '@/lib/security/audit';
import {
  buildMobileCorsHeaders,
  rejectDisallowedMobileOrigin,
  withApiRequest,
} from '@/lib/security/http';
import { verifyMobileRequest } from '@/lib/security/mobile-auth';
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const GEO_REVERSE_RATE_LIMIT = {
  limit: 60,
  windowMs: 60_000,
};

const geoReverseSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  timestamp: z.number().int().positive().optional(),
  signature: z.string().trim().min(10).max(512).optional(),
});

export async function POST(request: NextRequest): Promise<Response> {
  return withApiRequest(
    request,
    {
      route: '/api/geo/reverse',
      routeGroup: 'mobile.geo',
    },
    async ({ requestId, clientIp, userAgent }) => {
      const originRejection = rejectDisallowedMobileOrigin(request);
      if (originRejection) {
        return originRejection;
      }

      const rawBody = await request.json().catch(() => null);
      const parsed = geoReverseSchema.safeParse(rawBody);
      const baseHeaders = buildMobileCorsHeaders(request);

      if (!parsed.success) {
        return NextResponse.json(
          {
            error: 'Invalid request payload',
            details: parsed.error.flatten(),
          },
          { status: 400, headers: baseHeaders }
        );
      }

      const authResult = await verifyMobileRequest({
        body: parsed.data,
        route: '/api/geo/reverse',
        request,
        requestId,
        clientIp,
        userAgent,
        headers: baseHeaders,
      });

      if (!authResult.ok) {
        return authResult.response;
      }

      const [ipDecision, installDecision] = await Promise.all([
        consumeRateLimit({
          namespace: 'geo-reverse:ip',
          identifierParts: [clientIp],
          limit: GEO_REVERSE_RATE_LIMIT.limit,
          windowMs: GEO_REVERSE_RATE_LIMIT.windowMs,
        }),
        consumeRateLimit({
          namespace: 'geo-reverse:install',
          identifierParts: [authResult.installId],
          limit: GEO_REVERSE_RATE_LIMIT.limit,
          windowMs: GEO_REVERSE_RATE_LIMIT.windowMs,
        }),
      ]);
      const rateLimitDecision = !ipDecision.allowed ? ipDecision : installDecision;
      const headers = {
        ...baseHeaders,
        ...getRateLimitHeaders(rateLimitDecision),
      };

      if (rateLimitDecision.backend === 'unavailable') {
        return NextResponse.json(
          { error: 'Rate limiting backend unavailable' },
          { status: 503, headers }
        );
      }

      if (!rateLimitDecision.allowed) {
        await recordSecurityEvent({
          eventType: 'rate_limit_exceeded',
          route: '/api/geo/reverse',
          requestId,
          installId: authResult.installId,
          ip: clientIp,
          userAgent,
          outcome: 'denied',
          reasonCode: 'rate_limit',
        });

        return NextResponse.json(
          { error: 'Too many reverse geocoding requests' },
          {
            status: 429,
            headers: {
              ...headers,
              'Retry-After': String(rateLimitDecision.retryAfterSeconds),
            },
          }
        );
      }

      try {
        const result = await reverseGeocode(parsed.data.lat, parsed.data.lon);

        return NextResponse.json(result, {
          headers: {
            ...headers,
            'Cache-Control': 'public, max-age=3600, s-maxage=2592000',
          },
        });
      } catch (error) {
        captureExceptionWithContext(error, {
          area: 'api.geo-reverse',
          operation: 'POST /api/geo/reverse',
        });
        logger.error('api.geo_reverse.failed', { error });
        return NextResponse.json(
          { error: 'Failed to reverse geocode' },
          { status: 500, headers }
        );
      }
    }
  );
}

export async function OPTIONS(request: NextRequest): Promise<Response> {
  return withApiRequest(
    request,
    {
      route: '/api/geo/reverse',
      routeGroup: 'mobile.geo',
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
