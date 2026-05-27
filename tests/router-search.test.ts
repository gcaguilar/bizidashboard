import { describe, expect, it } from 'vitest';
import { getLocationSearchParams } from '@/lib/router-search';

describe('router search helper', () => {
  it('prefers searchStr when present', () => {
    const params = getLocationSearchParams({
      searchStr: '?a=1&b=2',
      search: '?ignored=1',
    });

    expect(params.get('a')).toBe('1');
    expect(params.get('b')).toBe('2');
    expect(params.get('ignored')).toBeNull();
  });

  it('falls back to search when searchStr is missing', () => {
    const params = getLocationSearchParams({
      search: '?q=plaza',
    });

    expect(params.get('q')).toBe('plaza');
  });
});
