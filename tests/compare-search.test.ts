import { describe, expect, it } from 'vitest';
import type { InteractiveComparisonOption } from '@/lib/comparison-hub';
import { rankComparisonOptions, STATION_POPULAR_HINTS } from '@/lib/compare-search';

function option(id: string, label: string): InteractiveComparisonOption {
  return {
    id,
    label,
    href: `/x/${id}`,
    primaryLabel: 'Giro',
    primaryValue: 1,
    primaryDisplay: '1 pts',
    secondaryLabel: 'Snapshot',
    secondaryDisplay: '1/10 bicis',
  };
}

const options = [
  option('1', 'Plaza España'),
  option('2', 'Plaza Aragón'),
  option('3', 'Paraninfo'),
  option('4', 'Actur Norte'),
  option('5', 'Delicias'),
  option('6', 'Zorongo'),
];

describe('rankComparisonOptions', () => {
  it('matches ignoring accents and word order', () => {
    const byAccentless = rankComparisonOptions({ options, query: 'espana' });
    const byPartial = rankComparisonOptions({ options, query: 'plaza aragon' });

    expect(byAccentless[0]?.id).toBe('1');
    expect(byPartial[0]?.id).toBe('2');
  });

  it('puts favorites first and surfaces popular hints before the rest when empty', () => {
    const ranked = rankComparisonOptions({
      options,
      query: '',
      favoriteIds: ['6'],
      popularHints: STATION_POPULAR_HINTS,
    });

    expect(ranked[0]?.id).toBe('6');
    const popularIds = ranked.map((entry) => entry.id);
    expect(popularIds.indexOf('1')).toBeLessThan(popularIds.indexOf('5'));
  });

  it('returns no matches for gibberish so the empty state can show', () => {
    expect(rankComparisonOptions({ options, query: 'zzzzzzzz' })).toHaveLength(0);
  });

  it('respects the limit', () => {
    expect(rankComparisonOptions({ options, query: '', limit: 2 })).toHaveLength(2);
  });
});
