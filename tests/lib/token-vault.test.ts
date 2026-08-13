import { describe, expect, it } from 'vitest';
import { decryptTokenValue, encryptTokenValue } from '@/lib/auth/token-vault';

describe('refresh rotation token vault', () => {
  it('round-trips encrypted token values without storing them in plaintext', () => {
    const token = 'refresh-token-value';
    const encrypted = encryptTokenValue(token);

    expect(encrypted).not.toContain(token);
    expect(decryptTokenValue(encrypted)).toBe(token);
  });

  it('rejects tampered ciphertext', () => {
    const encrypted = encryptTokenValue('access-token-value');
    const [iv, tag, ciphertext] = encrypted.split('.');
    const last = ciphertext.slice(-1);
    const tampered = `${iv}.${tag}.${ciphertext.slice(0, -1)}${last === 'A' ? 'B' : 'A'}`;

    expect(() => decryptTokenValue(tampered)).toThrow();
  });
});
