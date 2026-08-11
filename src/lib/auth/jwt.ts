import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { createHash, randomUUID  } from 'node:crypto';
import { logger } from '@/lib/logger';
import { KNOWN_INSECURE_SECRET_VALUES } from '@/lib/security/known-insecure-secrets';

const DEFAULT_SECRET = KNOWN_INSECURE_SECRET_VALUES[0];

function getJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;

  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    logger.warn('jwt.using_insecure_default');
    return new TextEncoder().encode(DEFAULT_SECRET);
  }

  if (raw.length < 32) {
    throw new Error(
      `JWT_SECRET must be at least 32 characters long (got ${raw.length}). Generate a strong secret: \`openssl rand -base64 32\``
    );
  }

  return new TextEncoder().encode(raw);
}

const JWT_SECRET = getJwtSecret();

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export interface AccessTokenPayload extends JWTPayload {
  installId: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  installId: string;
  type: 'refresh';
}

export type IssuedRefreshToken = {
  token: string;
  issuedAt: Date;
};

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function hashPublicKey(publicKey: string): string {
  return createHash('sha256').update(publicKey).digest('hex');
}

export async function generateAccessToken(installId: string): Promise<string> {
  const token = await new SignJWT({ installId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setJti(randomUUID())
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

export async function generateRefreshToken(installId: string): Promise<string> {
  const issued = await issueRefreshToken(installId);
  return issued.token;
}

export async function issueRefreshToken(installId: string): Promise<IssuedRefreshToken> {
  const issuedAt = new Date();
  const token = await new SignJWT({ installId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Math.floor(issuedAt.getTime() / 1000))
    .setJti(randomUUID())
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return {
    token,
    issuedAt,
  };
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
    // A refresh token lives 7 days; accepting one here would let it act as a
    // long-lived access token and bypass the rotation/reuse detection.
    if (payload.type === 'refresh' || typeof payload.installId !== 'string') {
      return null;
    }
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (payload.type !== 'refresh' || typeof payload.installId !== 'string') {
      return null;
    }
    return payload as RefreshTokenPayload;
  } catch {
    return null;
  }
}
