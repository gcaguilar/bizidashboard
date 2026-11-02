import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
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

/** The month is inside the published 36-month archive window. */
export function isMonthWithinReportWindow(
  monthKey: string,
  nowIso: string = new Date().toISOString(),
  window = REPORT_MONTHS_WINDOW
): boolean {
  if (!isValidMonthKey(monthKey)) return false;

  const now = new Date(nowIso);
  if (Number.isNaN(now.getTime())) return false;

  const currentStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const earliest = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (window - 1), 1);
  const { start } = getMonthBounds(monthKey);
  const startMs = Date.parse(start);

  return startMs >= earliest && startMs <= currentStart;
}

/**
 * Do not seal a closed month until the daily rollup had time to include its
 * final day. The analytics cron runs at 02:10 UTC on the first of the month;
 * a four-hour grace keeps early anonymous reads from freezing an incomplete
 * report into Redis/Postgres.
 */
export function isReportMonthSealable(
  monthKey: string,
  nowIso: string = new Date().toISOString(),
  graceHours = 4
): boolean {
  if (!isValidMonthKey(monthKey)) return false;

  const nowMs = Date.parse(nowIso);
  if (Number.isNaN(nowMs)) return false;

  const { endExclusive } = getMonthBounds(monthKey);
  return nowMs >= Date.parse(endExclusive) + graceHours * 3_600_000;
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

export function formatMonthLabel(monthKey: string, locale: Locale = DEFAULT_LOCALE): string {
  if (!isValidMonthKey(monthKey)) {
    return monthKey;
  }

  const { start } = getMonthBounds(monthKey);
  return new Date(start).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES', {
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
