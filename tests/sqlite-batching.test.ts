import { describe, expect, it } from 'vitest';
import { chunkRowsForSqlite, forEachSqliteBatch, getSqliteBatchSize } from '@/analytics/sqlite';

describe('sqlite batching utilities', () => {
  it('computes a safe batch size from variables per row', () => {
    expect(getSqliteBatchSize(7)).toBe(138);
  });

  it('splits rows into sqlite-safe chunks', () => {
    const rows = Array.from({ length: 275 }, (_, index) => index);
    const chunks = chunkRowsForSqlite(rows, 7);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(138);
    expect(chunks[1]).toHaveLength(137);
  });

  it('returns no chunks when there are no rows', () => {
    expect(chunkRowsForSqlite([], 7)).toEqual([]);
  });

  it('rejects invalid variables per row', () => {
    expect(() => getSqliteBatchSize(0)).toThrow('variablesPerRow must be a positive integer');
  });

  it('iterates chunks sequentially', async () => {
    const rows = Array.from({ length: 275 }, (_, index) => index);
    const observedChunks: number[][] = [];

    await forEachSqliteBatch(rows, 7, async (chunk, index) => {
      observedChunks[index] = chunk;
    });

    expect(observedChunks).toHaveLength(2);
    expect(observedChunks[0][0]).toBe(0);
    expect(observedChunks[1][0]).toBe(138);
    expect(observedChunks[1][136]).toBe(274);
  });
});
