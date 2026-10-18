import { describe, expect, it } from 'vitest';

import { average, averageOrNull, formatRatioDelta, toNumber } from '@/lib/format';

describe('formatRatioDelta', () => {
  it('signs a ratio and rounds it to whole percent', () => {
    expect(formatRatioDelta(0.2)).toBe('+20%');
    expect(formatRatioDelta(-0.154)).toBe('-15%');
    expect(formatRatioDelta(0)).toBe('+0%');
  });

  it('falls back to 0% when there is no ratio', () => {
    expect(formatRatioDelta(null)).toBe('0%');
    expect(formatRatioDelta(undefined)).toBe('0%');
    expect(formatRatioDelta(Number.NaN)).toBe('0%');
  });

  it('lets each caller name its own missing-reference wording', () => {
    expect(formatRatioDelta(null, 'sin referencia previa')).toBe('sin referencia previa');
    expect(formatRatioDelta(0.2, 'Sin referencia comparable')).toBe('+20%');
  });
});

describe('average and averageOrNull', () => {
  it('keeps the zero-on-empty and null-on-empty semantics apart', () => {
    expect(average([])).toBe(0);
    expect(averageOrNull([])).toBeNull();
  });

  it('averages a non-empty list the same way', () => {
    expect(average([2, 4, 6])).toBe(4);
    expect(averageOrNull([2, 4, 6])).toBe(4);
  });
});

describe('toNumber', () => {
  it('coerces numbers, numeric strings and bigints', () => {
    expect(toNumber(4.5)).toBe(4.5);
    expect(toNumber('0.42')).toBe(0.42);
    expect(toNumber(BigInt(7))).toBe(7);
  });

  it('falls back to 0 for missing or non-finite values', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber(Number.NaN)).toBe(0);
    expect(toNumber(Number.POSITIVE_INFINITY)).toBe(0);
    expect(toNumber('no soy un numero')).toBe(0);
    expect(toNumber({})).toBe(0);
  });
});
