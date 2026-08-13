import { createPublicKey, verify } from 'node:crypto';

/**
 * Registration proof for mobile installations.
 *
 * The public key is an Ed25519 SubjectPublicKeyInfo DER key encoded as base64.
 * The client signs this exact string with the matching private key.
 */
export function buildInstallRegistrationPayload(input: {
  platform: string;
  appVersion: string;
  osVersion: string;
  publicKey: string;
  challenge: string;
}): string {
  return [input.platform, input.appVersion, input.osVersion, input.publicKey, input.challenge].join('\n');
}

export function verifyInstallRegistrationProof(input: {
  platform: string;
  appVersion: string;
  osVersion: string;
  publicKey: string;
  challenge: string;
  signature: string;
}): boolean {
  try {
    const key = createPublicKey({
      key: Buffer.from(input.publicKey, 'base64'),
      format: 'der',
      type: 'spki',
    });

    return verify(
      null,
      Buffer.from(buildInstallRegistrationPayload(input), 'utf8'),
      key,
      Buffer.from(input.signature, 'base64'),
    );
  } catch {
    return false;
  }
}
