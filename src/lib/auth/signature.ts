import { createHmac, timingSafeEqual } from 'crypto';

if (!process.env.SIGNATURE_SECRET && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  throw new Error('SIGNATURE_SECRET is required in production');
}

if (!process.env.SIGNATURE_SECRET) {
  console.warn('[WARNING] SIGNATURE_SECRET not set - using insecure default. Set SIGNATURE_SECRET in production!');
}

const SIGNATURE_SECRET = process.env.SIGNATURE_SECRET || 'dev-secret-do-not-use-in-production';

export interface SignedRequest {
  body: string;
  timestamp: number;
  signature: string;
}

export function signRequest(body: unknown): SignedRequest {
  const timestamp = Date.now();
  const bodyString = JSON.stringify(body);
  const signature = createHmac('sha256', SIGNATURE_SECRET)
    .update(`${timestamp}.${bodyString}`)
    .digest('hex');

  return {
    body: bodyString,
    timestamp,
    signature,
  };
}

export function verifySignature(body: unknown, timestamp: number, signature: string): boolean {
  const bodyString = JSON.stringify(body);
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
  return Date.now() - timestamp > maxAgeMs;
}
