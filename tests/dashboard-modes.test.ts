import { describe, expect, it } from 'vitest';
import { resolveDashboardViewMode } from '@/lib/dashboard-modes';

describe('resolveDashboardViewMode', () => {
  it('returns overview by default', () => {
    expect(resolveDashboardViewMode(null)).toBe('overview');
    expect(resolveDashboardViewMode('')).toBe('overview');
  });

  it('accepts valid modes only', () => {
    expect(resolveDashboardViewMode('operations')).toBe('operations');
    expect(resolveDashboardViewMode('research')).toBe('research');
    expect(resolveDashboardViewMode('data')).toBe('data');
    expect(resolveDashboardViewMode('invalid')).toBe('overview');
  });
});
