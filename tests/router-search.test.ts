import { describe, expect, it } from 'vitest';
import { getLocationSearchParams, stringifyRouterSearch } from '@/lib/router-search';

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

describe('stringifyRouterSearch', () => {
  it('keeps numeric-looking string ids flat in the URL', () => {
    expect(stringifyRouterSearch({ stationId: '254', mapLat: 41.65 })).toBe(
      '?stationId=254&mapLat=41.65'
    );
  });

  it('still serializes objects and arrays with JSON', () => {
    expect(stringifyRouterSearch({ left: ['a', 'b'] })).toBe('?left=%5B%22a%22%2C%22b%22%5D');
  });

  it('does not wrap plain string values in JSON quotes', () => {
    expect(stringifyRouterSearch({ stationId: '254' })).not.toContain('%22');
  });
});
