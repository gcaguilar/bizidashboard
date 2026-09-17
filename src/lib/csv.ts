export type CsvRow = (string | number | boolean | null | undefined)[];

/**
 * Neutraliza inyeccion de formulas de hoja de calculo: si el texto empieza
 * por = + - @ o tabulador/retorno, se antepone una comilla simple para que
 * Excel/Sheets lo trate como texto literal.
 */
export function neutralizeCsvFormula(text: string): string {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

export function escapeCsvCell(value: unknown): string {
  if (typeof value === 'string') {
    return `"${neutralizeCsvFormula(value).replace(/"/g, '""')}"`;
  }
  const result = value === null || value === undefined ? '' : JSON.stringify(value);
  return `"${result.replace(/"/g, '""')}"`;
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