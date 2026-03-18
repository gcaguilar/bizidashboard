import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  throw new Error('JWT_SECRET is required in production');
}

if (!process.env.JWT_SECRET) {
  console.warn('[WARNING] JWT_SECRET not set - using insecure default. Set JWT_SECRET in production!');
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

export async function generateAccessToken(installId: string): Promise<string> {
  const token = await new SignJWT({ installId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

export async function generateRefreshToken(installId: string): Promise<string> {
  const token = await new SignJWT({ installId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return token;
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
