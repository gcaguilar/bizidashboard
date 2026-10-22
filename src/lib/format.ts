import { AlertType, DayType } from '@/analytics/types';
import { TIMEZONE } from '@/lib/timezone';

export const DEFAULT_TIME_ZONE = TIMEZONE;

const integerFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const smallDecimalFormatter = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

export function formatDecimal(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return (value < 10 && value > 0 ? smallDecimalFormatter : decimalFormatter).format(value);
}

export function formatRelativeMinutes(minutes?: number | null): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) {
    return 'sin datos';
  }

  const safeMinutes = Math.max(0, Math.round(minutes));

  if (safeMinutes < 1) {
    return 'hace menos de 1 min';
  }

  if (safeMinutes < 60) {
    return `hace ${safeMinutes} min`;
  }

  const hours = Math.round(safeMinutes / 60);
  return hours === 1 ? 'hace 1 h' : `hace ${hours} h`;
}

export function formatAlertType(alertType?: AlertType | string | null): string {
  switch (alertType) {
    case AlertType.LOW_BIKES:
      return 'Pocas bicis';
    case AlertType.LOW_ANCHORS:
      return 'Pocos anclajes';
    default:
      return 'Alerta desconocida';
  }
}

export function formatDayType(dayType?: DayType | string | null): string {
  switch (dayType) {
    case DayType.WEEKDAY:
      return 'Entre semana';
    case DayType.WEEKEND:
      return 'Fin de semana';
    default:
      return 'Día desconocido';
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

export function formatHourMinute(value: string | Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin datos';
  }

  return date.toLocaleTimeString('es-ES', {
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
