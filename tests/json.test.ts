import { describe, expect, it } from 'vitest';
import { isRecord, parseJsonWithGuard, tryParseJson } from '@/lib/json';

describe('json helpers', () => {
  it('returns parsed values for valid json', () => {
    const result = tryParseJson('{"ok":true}');

    expect(result.ok).toBe(true);
    expect(result.ok ? result.value : null).toEqual({ ok: true });
  });

  it('returns a failed result for invalid json', () => {
    const result = tryParseJson('{invalid}');

    expect(result.ok).toBe(false);
  });

  it('guards parsed payloads by shape', () => {
    const payload = parseJsonWithGuard(
      '{"version":"1.0.0","allowed":true}',
      (value): value is { version: string; allowed: boolean } =>
        isRecord(value) &&
        typeof value.version === 'string' &&
        typeof value.allowed === 'boolean'
    );

    expect(payload).toEqual({ version: '1.0.0', allowed: true });
    expect(
      parseJsonWithGuard('{"version":1}', (value): value is { version: string } =>
        isRecord(value) && typeof value.version === 'string'
      )
    ).toBeNull();
  });

  it('recognizes plain object records only', () => {
    expect(isRecord({ ok: true })).toBe(true);
    expect(isRecord(['not', 'a', 'record'])).toBe(false);
    expect(isRecord(null)).toBe(false);
  });
});
