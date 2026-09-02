import { describe, expect, it, vi } from 'vitest';
import { formatFreshnessLabel } from '@/lib/freshness';
import { productTerms } from '@/lib/product-copy';

describe('formatFreshnessLabel', () => {
  it('returns disconnected when data is older than 10 minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-11T12:00:00.000Z'));

    expect(formatFreshnessLabel('2026-03-11T11:49:00.000Z')).toBe('desconectado');

    vi.useRealTimers();
  });

  it('returns relative freshness when data is recent', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-11T12:00:00.000Z'));

    expect(formatFreshnessLabel('2026-03-11T11:58:30.000Z')).toContain('hace');

    vi.useRealTimers();
  });
});

describe('product vocabulary', () => {
  it('defines data status as a different concept from network balance', () => {
    expect(productTerms.dataStatus.definition).toContain('Frescura');
    expect(productTerms.networkBalance.definition).toContain('Disponibilidad');
    expect(productTerms.dataStatus.label).not.toBe(productTerms.networkBalance.label);
  });
});
