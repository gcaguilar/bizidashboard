export type CsvRow = (string | number | boolean | null | undefined)[];

export function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: CsvRow[]): string {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return [headerLine, ...dataLines].join('\n');
}

export function rowsToCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const dataRows = rows.map((row) => headers.map((h) => row[h]));
  return toCsv(headers, dataRows as CsvRow[]);
}