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

export type CsvResponseOptions = {
  /** Ordered column headers. */
  headers: string[];
  /** Rows as objects keyed by header, or as ordered cell arrays. */
  rows: CsvRow[] | Record<string, unknown>[];
  /** When set, the download filename (Content-Disposition attachment). */
  filename?: string;
  /** Extra response headers (e.g. rate-limit or cache headers). */
  extraHeaders?: Record<string, string>;
};

function asCellRows(
  headers: string[],
  rows: CsvRow[] | Record<string, unknown>[]
): CsvRow[] {
  return rows.map((row) =>
    Array.isArray(row)
      ? (row as CsvRow)
      : (headers.map(
          (header) => (row as Record<string, unknown>)[header]
        ) as CsvRow)
  );
}

/**
 * The single seam for CSV exports: neutralization, escaping, and the
 * text/csv response (Content-Type, optional Content-Disposition) live here,
 * so a CSV hardening lands once instead of drifting across call sites.
 */
export function csvResponse(options: CsvResponseOptions): Response {
  const { headers: columns, rows, filename, extraHeaders } = options;
  return new Response(toCsv(columns, asCellRows(columns, rows)), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      ...(filename ? { 'Content-Disposition': `attachment; filename="${filename}"` } : {}),
      ...extraHeaders,
    },
  });
}