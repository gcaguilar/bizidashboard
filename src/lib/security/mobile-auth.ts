import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { isSignatureExpired, verifySignature } from '@/lib/auth/signature';
import { updateExecutionContext } from '@/lib/request-context';
import { recordSecurityEvent } from '@/lib/security/audit';
import { shouldRequireSignedMobileRequests } from '@/lib/security/config';

type MobileSignedBody = {
  timestamp?: number;
  signature?: string;
};

type VerifyMobileRequestOptions<TBody extends MobileSignedBody> = {
  body: TBody;
  route: string;
  request: Request;
  requestId: string;
  clientIp: string;
  userAgent: string | null;
  headers?: Record<string, string>;
};

type VerifyMobileRequestResult =
  | {
      ok: true;
      installId: string;
    }
  | {
      ok: false;
      response: NextResponse;
    };

async function deny(
  options: {
    route: string;
    requestId: string;
    clientIp: string;
    userAgent: string | null;
    installId?: string | null;
    eventType: string;
    reasonCode: string;
    status: number;
    message: string;
    headers?: Record<string, string>;
  }
): Promise<VerifyMobileRequestResult> {
  await recordSecurityEvent({
    eventType: options.eventType,
    route: options.route,
    requestId: options.requestId,
    installId: options.installId ?? null,
    ip: options.clientIp,
    userAgent: options.userAgent,
    outcome: 'denied',
    reasonCode: options.reasonCode,
  });

  return {
    ok: false,
    response: NextResponse.json(
      { error: options.message },
      { status: options.status, headers: options.headers }
    ),
  };
}

export async function verifyMobileRequest<TBody extends MobileSignedBody>(
  options: VerifyMobileRequestOptions<TBody>
): Promise<VerifyMobileRequestResult> {
  const authHeader = options.request.headers.get('authorization');
  const installId = options.request.headers.get('x-installation-id')?.trim();

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return deny({
      route: options.route,
      requestId: options.requestId,
      clientIp: options.clientIp,
      userAgent: options.userAgent,
      eventType: 'auth_failed',
      reasonCode: 'missing_bearer_token',
      status: 401,
      message: 'Missing or invalid Authorization header',
      headers: options.headers,
    });
  }

  if (!installId) {
    return deny({
      route: options.route,
      requestId: options.requestId,
      clientIp: options.clientIp,
      userAgent: options.userAgent,
      eventType: 'auth_failed',
      reasonCode: 'missing_installation_id',
      status: 401,
      message: 'Missing X-Installation-Id header',
      headers: options.headers,
    });
  }

  const token = authHeader.slice(7);
  const payload = await verifyAccessToken(token);

  if (!payload || payload.installId !== installId) {
    return deny({
      route: options.route,
      requestId: options.requestId,
      clientIp: options.clientIp,
      userAgent: options.userAgent,
      installId,
      eventType: 'auth_failed',
      reasonCode: 'access_token_invalid',
      status: 401,
      message: 'Invalid or expired token',
      headers: options.headers,
    });
  }

  const install = await prisma.install.findUnique({
    where: { installId },
  });

  if (!install || !install.isActive || install.revokedAt) {
    return deny({
      route: options.route,
      requestId: options.requestId,
      clientIp: options.clientIp,
      userAgent: options.userAgent,
      installId,
      eventType: 'auth_failed',
      reasonCode: 'install_inactive',
      status: 401,
      message: 'Installation not found or inactive',
      headers: options.headers,
    });
  }

  const requireSignature = shouldRequireSignedMobileRequests();
  const { timestamp, signature } = options.body;

  if (requireSignature && (!timestamp || !signature)) {
    return deny({
      route: options.route,
      requestId: options.requestId,
      clientIp: options.clientIp,
      userAgent: options.userAgent,
      installId,
      eventType: 'signature_invalid',
      reasonCode: 'signature_required',
      status: 401,
      message: 'Signed request required',
      headers: options.headers,
    });
  }

  if (timestamp || signature) {
    if (!timestamp || !signature) {
      return deny({
        route: options.route,
        requestId: options.requestId,
        clientIp: options.clientIp,
        userAgent: options.userAgent,
        installId,
        eventType: 'signature_invalid',
        reasonCode: 'signature_missing_fields',
        status: 401,
        message: 'Missing signed request fields',
        headers: options.headers,
      });
    }

    if (isSignatureExpired(timestamp, 60_000)) {
      return deny({
        route: options.route,
        requestId: options.requestId,
        clientIp: options.clientIp,
        userAgent: options.userAgent,
        installId,
        eventType: 'signature_invalid',
        reasonCode: 'signature_expired',
        status: 401,
        message: 'Request timestamp expired',
        headers: options.headers,
      });
    }

    if (!verifySignature(options.body, timestamp, signature)) {
      return deny({
        route: options.route,
        requestId: options.requestId,
        clientIp: options.clientIp,
        userAgent: options.userAgent,
        installId,
        eventType: 'signature_invalid',
        reasonCode: 'signature_mismatch',
        status: 401,
        message: 'Invalid signature',
        headers: options.headers,
      });
    }
  }

  await prisma.install.update({
    where: { installId },
    data: {
      lastSeenAt: new Date(),
      lastAuthAt: new Date(),
    },
  });

  updateExecutionContext({
    installId,
  });

  return {
    ok: true,
    installId,
  };
}
