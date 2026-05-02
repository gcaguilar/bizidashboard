import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from '@/lib/logger';

const DEFAULT_SECRET = 'dev-secret-do-not-use-in-production';

function getSignatureSecret(): string {
  const raw = process.env.SIGNATURE_SECRET;

  if (!raw) {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
      throw new Error('SIGNATURE_SECRET is required in production');
    }
    logger.warn('signature.using_insecure_default');
    return DEFAULT_SECRET;
  }

  if (raw.length < 32) {
    throw new Error(
      `SIGNATURE_SECRET must be at least 32 characters long (got ${raw.length}). Generate a strong secret: \`openssl rand -base64 32\``
    );
  }

  return raw;
}

const SIGNATURE_SECRET = getSignatureSecret();

export interface SignedRequest {
  body: string;
  timestamp: number;
  signature: string;
}

function normalizeSignedPayload(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return JSON.stringify(body);
  }

  const clone = { ...(body as Record<string, unknown>) };
  delete clone.signature;
  return JSON.stringify(clone);
}

export function signRequest(body: unknown): SignedRequest {
  const timestamp = Date.now();
  const payload =
    body && typeof body === 'object' && !Array.isArray(body)
      ? { ...(body as Record<string, unknown>), timestamp }
      : { body, timestamp };
  const bodyString = JSON.stringify(payload);
  const signature = createHmac('sha256', SIGNATURE_SECRET)
    .update(`${timestamp}.${normalizeSignedPayload(payload)}`)
    .digest('hex');

  return {
    body: bodyString,
    timestamp,
    signature,
  };
}

export function verifySignature(body: unknown, timestamp: number, signature: string): boolean {
  const bodyString = normalizeSignedPayload(body);
  const expectedSignature = createHmac('sha256', SIGNATURE_SECRET)
    .update(`${timestamp}.${bodyString}`)
    .digest('hex');

  try {
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export function isSignatureExpired(timestamp: number, maxAgeMs = 60000): boolean {
  return Math.abs(Date.now() - timestamp) > maxAgeMs;
}
