import { describe, expect, it } from 'vitest';
import { getMonthBounds, normalizeMonthSearchParam, resolveActiveMonth } from '@/lib/months';

describe('month boundaries and selection', () => {
  it('builds stable UTC boundaries for a month key', () => {
    expect(getMonthBounds('2026-03')).toEqual({
      start: '2026-03-01T00:00:00.000Z',
      endExclusive: '2026-04-01T00:00:00.000Z',
    });
  });

  it('keeps leap-year boundaries correct', () => {
    expect(getMonthBounds('2024-02')).toEqual({
      start: '2024-02-01T00:00:00.000Z',
      endExclusive: '2024-03-01T00:00:00.000Z',
    });
  });

  it('accepts only valid month query params and active published months', () => {
    const availableMonths = ['2026-03', '2026-02'];
    const selected = normalizeMonthSearchParam('2026-03');
    const invalid = normalizeMonthSearchParam('2026-3');

    expect(resolveActiveMonth(availableMonths, selected)).toBe('2026-03');
    expect(resolveActiveMonth(availableMonths, invalid)).toBeNull();
    expect(resolveActiveMonth(availableMonths, '2026-01')).toBeNull();
  });
});
