import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { logger } from '@/lib/logger';

const DEFAULT_SECRET = 'dev-secret-do-not-use-in-production';

function getJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;

  if (!raw) {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
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
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type !== 'refresh') {
      return null;
    }
    return payload as RefreshTokenPayload;
  } catch {
    return null;
  }
}
