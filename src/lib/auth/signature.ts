import { createPublicKey, verify } from 'node:crypto';

function normalizeSignedPayload(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return JSON.stringify(body);
  }

  const clone = { ...(body as Record<string, unknown>) };
  delete clone.signature;
  return JSON.stringify(clone);
}

export function verifyInstallSignature(
  publicKeyBase64: string,
  body: unknown,
  timestamp: number,
  signature: string,
): boolean {
  try {
    const publicKey = createPublicKey({
      key: Buffer.from(publicKeyBase64, 'base64'),
      format: 'der',
      type: 'spki',
    });
    if (publicKey.asymmetricKeyType !== 'ed25519') return false;
    const signatureBytes = Buffer.from(signature, 'base64');
    if (signatureBytes.length !== 64) return false;

    return verify(
      null,
      Buffer.from(`${timestamp}.${normalizeSignedPayload(body)}`, 'utf8'),
      publicKey,
      signatureBytes,
    );
  } catch {
    return false;
  }
}

export function isSignatureExpired(timestamp: number, maxAgeMs = 5 * 60_000): boolean {
  return Math.abs(Date.now() - timestamp) > maxAgeMs;
}
