import { describe, expect, it } from 'vitest';
import { isSafeReturnTo } from '@/lib/auth/return-to';

describe('isSafeReturnTo', () => {
  it('accepts ordinary local paths', () => {
    expect(isSafeReturnTo('/developers')).toBe(true);
    expect(isSafeReturnTo('/estaciones?orden=nombre')).toBe(true);
    expect(isSafeReturnTo('/a/b#section')).toBe(true);
  });

  it('rejects protocol-relative and off-origin paths', () => {
    expect(isSafeReturnTo('//evil.example')).toBe(false);
    expect(isSafeReturnTo('https://evil.example')).toBe(false);
    expect(isSafeReturnTo('developers')).toBe(false);
    expect(isSafeReturnTo('')).toBe(false);
  });

  it('rejects backslash and control-character authority switches', () => {
    expect(isSafeReturnTo('/\\evil.example')).toBe(false);
    expect(isSafeReturnTo('/\t/evil.example')).toBe(false);
    expect(isSafeReturnTo('/\n/evil.example')).toBe(false);
    expect(isSafeReturnTo('/\u0000evil.example')).toBe(false);
  });
});
