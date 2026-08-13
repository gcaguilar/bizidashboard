import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildInstallRegistrationPayload, verifyInstallRegistrationProof } from '@/lib/auth/install-proof';

describe('installation registration proof', () => {
  it('verifies an Ed25519 proof for the exact registration payload', () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const publicKeyBase64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
    const input = {
      platform: 'android',
      appVersion: '1.0.0',
      osVersion: '15',
      publicKey: publicKeyBase64,
      challenge: Buffer.from('random-client-challenge').toString('base64'),
    };
    const signature = sign(null, Buffer.from(buildInstallRegistrationPayload(input)), privateKey).toString('base64');

    expect(verifyInstallRegistrationProof({ ...input, signature })).toBe(true);
    expect(verifyInstallRegistrationProof({ ...input, appVersion: '1.0.1', signature })).toBe(false);
  });

  it('rejects a proof made with a different private key', () => {
    const first = generateKeyPairSync('ed25519');
    const second = generateKeyPairSync('ed25519');
    const publicKey = first.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
    const input = { platform: 'ios', appVersion: '1', osVersion: '18', publicKey, challenge: 'Y2hhbGxlbmdl' };
    const signature = sign(null, Buffer.from(buildInstallRegistrationPayload(input)), second.privateKey).toString('base64');

    expect(verifyInstallRegistrationProof({ ...input, signature })).toBe(false);
  });
});
