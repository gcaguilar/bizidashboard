// Response removed;
import { prisma } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { isSignatureExpired, verifyInstallSignature } from '@/lib/auth/signature';
import { updateExecutionContext } from '@/lib/request-context';
import { recordSecurityEvent } from '@/lib/security/audit';

type MobileSignedBody = Record<string, unknown>;

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
      response: Response;
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
    response: Response.json(
      { error: options.message, details: options.reasonCode },
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
    select: { installId: true, isActive: true, revokedAt: true, publicKeyMaterial: true },
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

  const { timestamp, signature } = options.body;

  if (!Number.isSafeInteger(timestamp) || timestamp <= 0 || typeof signature !== 'string' || !signature.trim()) {
    return deny({
      route: options.route,
      requestId: options.requestId,
      clientIp: options.clientIp,
      userAgent: options.userAgent,
      installId,
      eventType: 'signature_invalid',
      reasonCode: 'signature_required',
      status: 401,
      message: 'Signed request requires timestamp and signature',
      headers: options.headers,
    });
  }

  if (isSignatureExpired(timestamp)) {
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

  if (!install.publicKeyMaterial || !verifyInstallSignature(install.publicKeyMaterial, options.body, timestamp, signature)) {
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
