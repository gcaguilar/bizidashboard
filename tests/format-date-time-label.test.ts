import { describe, expect, it } from 'vitest';
import { formatDateTimeLabel } from '@/lib/format';

describe('formatDateTimeLabel', () => {
  it('formats valid ISO date in Europe/Madrid timezone by default', () => {
    expect(formatDateTimeLabel('2026-05-26T10:30:00.000Z')).toBe('26/05/2026, 12:30');
  });

  it('returns fallback text when date is invalid', () => {
    expect(formatDateTimeLabel('invalid-date')).toBe('Sin datos');
  });
});
