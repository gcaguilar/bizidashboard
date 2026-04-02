import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { logger } from '@/lib/logger';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  throw new Error('JWT_SECRET is required in production');
}

if (!process.env.JWT_SECRET) {
  logger.warn('jwt.using_insecure_default');
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production'
);

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '30d'; // 30 days

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
