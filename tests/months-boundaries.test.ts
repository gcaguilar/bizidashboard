import { describe, expect, it } from 'vitest';
import { getMonthBounds, normalizeMonthSearchParam, resolveActiveMonth } from '@/lib/months';
import { buildMonthlyTemporalComparison } from '@/lib/temporal-comparison';

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

  it('uses matching calendar days across a year boundary for a running month', () => {
    const comparison = buildMonthlyTemporalComparison({
      monthKey: '2026-01',
      rows: [
        { day: '2025-12-01', demandScore: 50, sampleCount: 10 },
        { day: '2025-12-02', demandScore: 50, sampleCount: 10 },
        { day: '2026-01-01', demandScore: 75, sampleCount: 10 },
        { day: '2026-01-02', demandScore: 75, sampleCount: 10 },
      ],
      nowIso: '2026-01-02T12:00:00.000Z',
    });

    expect(comparison.right?.monthKey).toBe('2025-12');
    expect(comparison.isComparable).toBe(true);
    expect(comparison.normalizedDemandRatio).toBe(0.5);
  });

  it('keeps day-based coverage stable across the daylight-saving month', () => {
    const comparison = buildMonthlyTemporalComparison({
      monthKey: '2026-10',
      rows: [
        { day: '2026-09-25', demandScore: 100, sampleCount: 24 },
        { day: '2026-10-25', demandScore: 100, sampleCount: 25 },
      ],
      nowIso: '2026-10-25T23:30:00.000Z',
    });

    expect(comparison.left.coveredDays).toBe(1);
    expect(comparison.right?.coveredDays).toBe(1);
    expect(comparison.isComparable).toBe(true);
  });
});
