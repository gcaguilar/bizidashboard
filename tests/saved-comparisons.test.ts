import { describe, expect, it } from 'vitest';
import { parseSavedComparisons } from '@/lib/use-saved-comparisons';

describe('parseSavedComparisons', () => {
  it('keeps valid entries and normalizes the scope', () => {
    const parsed = parseSavedComparisons(
      JSON.stringify([
        { dimension: 'stations', left: '101', right: '102', scope: null },
        { dimension: 'periods', left: 'today', right: 'same-weekday-last-week', scope: 'centro' },
      ])
    );

    expect(parsed).toEqual([
      { dimension: 'stations', left: '101', right: '102', scope: null },
      { dimension: 'periods', left: 'today', right: 'same-weekday-last-week', scope: 'centro' },
    ]);
  });

  it('drops malformed entries and non-array payloads', () => {
    expect(parseSavedComparisons(null)).toEqual([]);
    expect(parseSavedComparisons('{"not":"an array"}')).toEqual([]);
    expect(
      parseSavedComparisons(JSON.stringify([{ dimension: 'stations', left: '101' }, 'nope', 42]))
    ).toEqual([]);
  });

  it('caps the stored list at eight entries', () => {
    const many = Array.from({ length: 12 }, (_, index) => ({
      dimension: 'stations',
      left: `left-${index}`,
      right: `right-${index}`,
      scope: null,
    }));

    expect(parseSavedComparisons(JSON.stringify(many))).toHaveLength(8);
  });
});
