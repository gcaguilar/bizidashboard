import { AlertType, DayType } from '@/analytics/types';

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
      return 'Dia desconocido';
  }
}

export function formatPercent(value?: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '0%';
  }

  const clamped = Math.min(100, Math.max(0, value));
  const rounded = Math.round(clamped);
  return `${rounded}%`;
}
