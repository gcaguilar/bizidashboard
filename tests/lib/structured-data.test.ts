import { describe, it, expect } from 'vitest';
import { toJsonLdScript } from '@/lib/structured-data';

describe('toJsonLdScript', () => {
  it('serializes JSON normally', () => {
    expect(toJsonLdScript({ a: 1 })).toBe('{"a":1}');
  });

  it('escapes script-breaking sequences', () => {
    const result = toJsonLdScript({ name: '</script><script>alert(1)</script>' });
    expect(result).not.toContain('</script>');
    expect(result).toContain('\\u003c/script\\u003e');
    expect(JSON.parse(result.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>'))).toEqual({
      name: '</script><script>alert(1)</script>',
    });
  });

  it('escapes ampersands', () => {
    expect(toJsonLdScript({ q: 'a&b' })).toContain('\\u0026');
  });
});
