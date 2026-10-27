import { AlertType, DayType } from '@/analytics/types';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import { translate } from '@/lib/i18n/messages';
import { TIMEZONE } from '@/lib/timezone';

export const DEFAULT_TIME_ZONE = TIMEZONE;

const INTL_LOCALE: Record<Locale, string> = { es: 'es-ES', en: 'en-US' };

type NumberFormatters = { integer: Intl.NumberFormat; decimal: Intl.NumberFormat; smallDecimal: Intl.NumberFormat };

const numberFormatters: Record<Locale, NumberFormatters> = {
  es: buildNumberFormatters('es'),
  en: buildNumberFormatters('en'),
};

function buildNumberFormatters(locale: Locale): NumberFormatters {
  const tag = INTL_LOCALE[locale];
  return {
    integer: new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }),
    decimal: new Intl.NumberFormat(tag, { maximumFractionDigits: 1 }),
    smallDecimal: new Intl.NumberFormat(tag, { maximumFractionDigits: 1, minimumFractionDigits: 1 }),
  };
}

export function formatInteger(value: number, locale: Locale = DEFAULT_LOCALE): string {
  return numberFormatters[locale].integer.format(value);
}

export function formatDecimal(value: number | null | undefined, locale: Locale = DEFAULT_LOCALE): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  const formatters = numberFormatters[locale];
  return (value < 10 && value > 0 ? formatters.smallDecimal : formatters.decimal).format(value);
}

export function formatRelativeMinutes(minutes?: number | null, locale: Locale = DEFAULT_LOCALE): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) {
    return translate(locale, 'format.noData.lower');
  }

  const safeMinutes = Math.max(0, Math.round(minutes));

  if (safeMinutes < 1) {
    return translate(locale, 'format.relative.lessThanMinute');
  }

  if (safeMinutes < 60) {
    return translate(locale, 'format.relative.minutes', { count: safeMinutes });
  }

  const hours = Math.round(safeMinutes / 60);
  return hours === 1
    ? translate(locale, 'format.relative.hour')
    : translate(locale, 'format.relative.hours', { count: hours });
}

export function formatAlertType(alertType?: AlertType | string | null, locale: Locale = DEFAULT_LOCALE): string {
  switch (alertType) {
    case AlertType.LOW_BIKES:
      return translate(locale, 'format.alertType.lowBikes');
    case AlertType.LOW_ANCHORS:
      return translate(locale, 'format.alertType.lowAnchors');
    default:
      return translate(locale, 'format.alertType.unknown');
  }
}

export function formatDayType(dayType?: DayType | string | null, locale: Locale = DEFAULT_LOCALE): string {
  switch (dayType) {
    case DayType.WEEKDAY:
      return translate(locale, 'format.dayType.weekday');
    case DayType.WEEKEND:
      return translate(locale, 'format.dayType.weekend');
    default:
      return translate(locale, 'format.dayType.unknown');
  }
}

export function formatPercent(value?: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '0%';
  }

  const normalized = Math.abs(value) <= 1 ? value * 100 : value;
  const clamped = Math.min(100, Math.max(0, normalized));
  const rounded = Math.round(clamped);
  return `${rounded}%`;
}

export function formatHourMinute(
  value: string | Date,
  timeZone: string = DEFAULT_TIME_ZONE,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return translate(locale, 'format.noData.capital');
  }

  return date.toLocaleTimeString(INTL_LOCALE[locale], {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateLabel(value: string | Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin datos';
  }

  return date.toLocaleDateString('es-ES', {
    timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeLabel(value: string | Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin datos';
  }

  return date.toLocaleString('es-ES', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatHourRange(hour: number): string {
  const nextHour = (hour + 1) % 24;
  return `${String(hour).padStart(2, '0')}:00-${String(nextHour).padStart(2, '0')}:00`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Redondea a un numero fijo de decimales. */
export function roundTo(value: number, decimals = 4): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Ratio (-0.15) -> "-15%"; ratio (0.2) -> "+20%". Si no hay referencia (null,
 * undefined o no finito) devuelve `fallback`, que cada contexto elige.
 */
export function formatRatioDelta(
  ratio: number | null | undefined,
  fallback = '0%'
): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) {
    return fallback;
  }

  return `${ratio >= 0 ? '+' : '-'}${Math.round(Math.abs(ratio) * 100)}%`;
}

/** Magnitud de un ratio sin signo: (-0.15) -> "15%". */
export function formatRatioMagnitude(ratio: number): string {
  if (!Number.isFinite(ratio)) {
    return '0%';
  }

  return `${Math.round(Math.abs(ratio) * 100)}%`;
}

export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Media de la lista, o `null` si esta vacia (para distinguir "sin datos"). */
export function averageOrNull(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Coacciona cualquier valor a un numero finito; lo no numerico cae a 0. */
export function toNumber(value: unknown): number {
  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (value === null || value === undefined) {
    return 0;
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}
