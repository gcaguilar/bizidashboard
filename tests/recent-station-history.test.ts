import { describe, expect, it } from 'vitest';
import {
  parseRecentSnapshots,
  pushRecentSnapshot,
} from '@/lib/recent-station-history';

describe('recent station history helpers', () => {
  it('parses only valid numeric snapshot values', () => {
    const parsed = parseRecentSnapshots(
      JSON.stringify([{ recordedAt: '2026-03-11T10:00:00.000Z', snapshot: { a: 3, b: 'x', c: 1 } }])
    );

    expect(parsed).toEqual([{ recordedAt: '2026-03-11T10:00:00.000Z', snapshot: { a: 3, c: 1 } }]);
  });

  it('keeps only the latest 20 snapshots', () => {
    const snapshots = Array.from({ length: 20 }).map((_, index) => ({
      recordedAt: `2026-03-11T10:${String(index).padStart(2, '0')}:00.000Z`,
      snapshot: { a: index },
    }));

    const next = pushRecentSnapshot(snapshots, {
      recordedAt: '2026-03-11T10:20:00.000Z',
      snapshot: { a: 20 },
    });

    expect(next).toHaveLength(20);
    expect(next[0]?.recordedAt).toBe('2026-03-11T10:01:00.000Z');
    expect(next.at(-1)?.recordedAt).toBe('2026-03-11T10:20:00.000Z');
  });
});
