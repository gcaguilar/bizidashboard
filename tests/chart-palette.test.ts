import { describe, expect, it } from 'vitest';
import { CATEGORICAL_PALETTE, getCategoricalColor } from '@/lib/chart-palette';

describe('categorical chart palette', () => {
  it('offers enough distinct colours for a city-wide district chart', () => {
    expect(CATEGORICAL_PALETTE.length).toBeGreaterThanOrEqual(16);
    expect(new Set(CATEGORICAL_PALETTE).size).toBe(CATEGORICAL_PALETTE.length);
  });

  it('only exposes valid hex colours', () => {
    for (const color of CATEGORICAL_PALETTE) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('maps indexes to stable colours and wraps around safely', () => {
    expect(getCategoricalColor(0)).toBe(CATEGORICAL_PALETTE[0]);
    expect(getCategoricalColor(5)).toBe(CATEGORICAL_PALETTE[5]);
    expect(getCategoricalColor(CATEGORICAL_PALETTE.length)).toBe(CATEGORICAL_PALETTE[0]);
    expect(getCategoricalColor(-1)).toBe(CATEGORICAL_PALETTE[0]);
    expect(getCategoricalColor(Number.NaN)).toBe(CATEGORICAL_PALETTE[0]);
  });
});
