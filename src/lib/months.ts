export type MonthOption = {
  key: string;
  label: string;
};

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Ventana de meses que comparten el sitemap y los informes. Deben usar el mismo
 * limite para que un mes listado en el sitemap no acabe marcado como `noindex`.
 */
export const REPORT_MONTHS_WINDOW = 36;

export function isValidMonthKey(value: string | null | undefined): value is string {
  return typeof value === 'string' && MONTH_KEY_PATTERN.test(value);
}

export function normalizeMonthSearchParam(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return isValidMonthKey(candidate) ? candidate : null;
}

export function getMonthBounds(monthKey: string): { start: string; endExclusive: string } {
  const [year, month] = monthKey.split('-').map(Number);
  const start = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, 1));
  const end = new Date(Date.UTC(year ?? 1970, month ?? 1, 1));

  return {
    start: start.toISOString(),
    endExclusive: end.toISOString(),
  };
}

export function formatMonthLabel(monthKey: string): string {
  if (!isValidMonthKey(monthKey)) {
    return monthKey;
  }

  const { start } = getMonthBounds(monthKey);
  return new Date(start).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function previousMonthKey(monthKey: string): string | null {
  if (!isValidMonthKey(monthKey)) {
    return null;
  }

  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function monthDayCount(monthKey: string): number {
  if (!isValidMonthKey(monthKey)) {
    return 0;
  }

  const { start, endExclusive } = getMonthBounds(monthKey);
  return Math.round((Date.parse(endExclusive) - Date.parse(start)) / 86_400_000);
}

export function formatMonthName(monthKey: string): string {
  if (!isValidMonthKey(monthKey)) {
    return monthKey;
  }

  return new Intl.DateTimeFormat('es-ES', { month: 'long', timeZone: 'UTC' }).format(
    new Date(`${monthKey}-01T00:00:00.000Z`)
  );
}

export function toMonthOptions(months: string[]): MonthOption[] {
  return months.filter(isValidMonthKey).map((key) => ({
    key,
    label: formatMonthLabel(key),
  }));
}

export function resolveActiveMonth(availableMonths: string[], value: string | null): string | null {
  if (!value) {
    return null;
  }

  return availableMonths.includes(value) ? value : null;
}
