export const MAX_BULK_QUERY_PARAMETERS = 5_000;

export function chunkRowsForBulkQuery<T>(
  rows: readonly T[],
  paramsPerRow: number,
  maxParameters = MAX_BULK_QUERY_PARAMETERS
): T[][] {
  if (!Number.isInteger(paramsPerRow) || paramsPerRow <= 0) {
    throw new Error('paramsPerRow must be a positive integer.');
  }

  const rowsPerChunk = Math.max(1, Math.floor(maxParameters / paramsPerRow));
  const chunks: T[][] = [];

  for (let index = 0; index < rows.length; index += rowsPerChunk) {
    chunks.push(rows.slice(index, index + rowsPerChunk));
  }

  return chunks;
}
