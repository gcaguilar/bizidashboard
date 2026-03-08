const SQLITE_MAX_VARIABLES = 999;
const SQLITE_VARIABLE_BUFFER = 32;

export function getSqliteBatchSize(variablesPerRow: number): number {
  if (!Number.isFinite(variablesPerRow) || variablesPerRow < 1) {
    throw new Error('variablesPerRow must be a positive integer');
  }

  const maxVariablesPerStatement = SQLITE_MAX_VARIABLES - SQLITE_VARIABLE_BUFFER;
  return Math.max(1, Math.floor(maxVariablesPerStatement / variablesPerRow));
}

export function chunkRowsForSqlite<T>(rows: T[], variablesPerRow: number): T[][] {
  if (rows.length === 0) {
    return [];
  }

  const chunkSize = getSqliteBatchSize(variablesPerRow);
  const chunks: T[][] = [];

  for (let index = 0; index < rows.length; index += chunkSize) {
    chunks.push(rows.slice(index, index + chunkSize));
  }

  return chunks;
}

export async function forEachSqliteBatch<T>(
  rows: T[],
  variablesPerRow: number,
  callback: (rowChunk: T[], chunkIndex: number) => Promise<void>
): Promise<void> {
  const rowChunks = chunkRowsForSqlite(rows, variablesPerRow);

  for (let chunkIndex = 0; chunkIndex < rowChunks.length; chunkIndex += 1) {
    await callback(rowChunks[chunkIndex], chunkIndex);
  }
}
