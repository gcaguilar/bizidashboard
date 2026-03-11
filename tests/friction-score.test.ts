import { describe, expect, it } from 'vitest';
import { calculateFrictionScore } from '@/app/dashboard/_components/useSystemMetrics';

describe('calculateFrictionScore', () => {
  it('sums empty and full hours', () => {
    expect(calculateFrictionScore(3, 4)).toBe(7);
  });

  it('never returns negative values', () => {
    expect(calculateFrictionScore(-3, 4)).toBe(4);
  });
});
