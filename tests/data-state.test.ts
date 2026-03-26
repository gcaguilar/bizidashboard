import { describe, expect, it } from 'vitest';
import {
  combineDataStates,
  resolveDataState,
  resolveHistoryDataState,
  resolveStatusDataState,
} from '@/lib/data-state';

describe('data-state helpers', () => {
  it('prioritizes loading, error, coverage, and content in resolveDataState', () => {
    expect(resolveDataState({ isLoading: true })).toBe('loading');
    expect(resolveDataState({ error: new Error('boom') })).toBe('error');
    expect(resolveDataState({ hasCoverage: false, hasData: false })).toBe('no_coverage');
    expect(resolveDataState({ hasCoverage: true, hasData: false })).toBe('empty');
    expect(resolveDataState({ hasCoverage: true, hasData: true, isStale: true })).toBe('stale');
    expect(resolveDataState({ hasCoverage: true, hasData: true, isPartial: true })).toBe('partial');
    expect(resolveDataState({ hasCoverage: true, hasData: true })).toBe('ok');
  });

  it('combines multiple states with the highest-severity outcome', () => {
    expect(combineDataStates(['ok', 'partial'])).toBe('partial');
    expect(combineDataStates(['ok', 'stale'])).toBe('stale');
    expect(combineDataStates(['empty', 'ok'])).toBe('partial');
    expect(combineDataStates(['error', 'ok'])).toBe('error');
    expect(combineDataStates(['no_coverage', 'no_coverage'])).toBe('no_coverage');
  });

  it('marks healthy status as ok and incomplete history as partial', () => {
    expect(
      resolveStatusDataState({
        pipeline: {
          totalRowsCollected: 1440,
          healthStatus: 'healthy',
        },
        quality: {
          freshness: {
            isFresh: true,
            lastUpdated: '2026-03-09T10:30:00.000Z',
          },
          volume: {
            recentStationCount: 276,
            expectedRange: { min: 200, max: 500 },
          },
        },
      } as never)
    ).toBe('ok');

    expect(
      resolveHistoryDataState({
        count: 9,
        expectedDays: 30,
        coverage: {
          generatedAt: '2026-03-09T10:35:00.000Z',
          lastRecordedAt: '2026-03-09T10:30:00.000Z',
          totalDays: 9,
          totalSamples: 1440,
        },
      })
    ).toBe('partial');
  });
});
