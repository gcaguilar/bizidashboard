export type ServiceCauseKind = 'holiday' | 'event' | 'strike' | 'works' | 'weather';

export type ServiceCause = {
  kind: ServiceCauseKind;
  label: string;
};

type DateParts = {
  year: number;
  month: number;
  day: number;
};

type CuratedServiceEvent = {
  from: string;
  to?: string;
  kind: ServiceCauseKind;
  label: string;
};

const FIXED_HOLIDAYS: ReadonlyArray<{ month: number; day: number; label: string }> = [
  { month: 1, day: 1, label: 'Año Nuevo' },
  { month: 1, day: 6, label: 'Día de Reyes' },
  { month: 5, day: 1, label: 'Día del Trabajo' },
  { month: 8, day: 15, label: 'Asunción de la Virgen' },
  { month: 10, day: 12, label: 'Fiesta Nacional y del Pilar' },
  { month: 11, day: 1, label: 'Todos los Santos' },
  { month: 12, day: 6, label: 'Día de la Constitución' },
  { month: 12, day: 8, label: 'Inmaculada Concepción' },
  { month: 12, day: 25, label: 'Navidad' },
];

/**
 * Eventos conocidos que condicionan el uso del servicio (huelgas, obras o
 * episodios de meteo adversa). Lista curada y mantenible: añade aquí un rango
 * de fechas cuando se confirme un evento. Se comprueba antes que los festivos.
 */
const CURATED_SERVICE_EVENTS: ReadonlyArray<CuratedServiceEvent> = [
  // Ejemplo:
  // { from: '2026-05-12', to: '2026-05-14', kind: 'strike', label: 'Huelga de transporte urbano' },
];

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDateKey(dateKey: string): DateParts | null {
  const match = DATE_KEY_PATTERN.exec(dateKey);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  // Rechaza fechas imposibles (p. ej. 2026-02-31) que Date normalizaria a marzo.
  if (toDateKey(new Date(Date.UTC(year, month - 1, day))) !== dateKey) {
    return null;
  }

  return { year, month, day };
}

function toUtcDate(parts: DateParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate()
  ).padStart(2, '0')}`;
}

/** Domingo de Pascua (algoritmo de Gauss/Meeus) en UTC. */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(Date.UTC(year, month - 1, day));
}

function findCuratedCause(dateKey: string): CuratedServiceEvent | null {
  for (const event of CURATED_SERVICE_EVENTS) {
    const to = event.to ?? event.from;

    if (dateKey >= event.from && dateKey <= to) {
      return event;
    }
  }

  return null;
}

export function getServiceCause(dateKey: string): ServiceCause | null {
  const parsed = parseDateKey(dateKey);

  if (!parsed) {
    return null;
  }

  const curated = findCuratedCause(dateKey);

  if (curated) {
    return { kind: curated.kind, label: curated.label };
  }

  const fixed = FIXED_HOLIDAYS.find(
    (holiday) => holiday.month === parsed.month && holiday.day === parsed.day
  );

  if (fixed) {
    return { kind: 'holiday', label: fixed.label };
  }

  // Semana grande de Zaragoza: afluencia muy superior a la habitual.
  if (parsed.month === 10 && parsed.day >= 10 && parsed.day <= 13) {
    return { kind: 'event', label: 'Fiestas del Pilar' };
  }

  const easter = getEasterSunday(parsed.year);
  const key = toDateKey(toUtcDate(parsed));

  if (key === toDateKey(addDays(easter, -3))) {
    return { kind: 'holiday', label: 'Jueves Santo' };
  }

  if (key === toDateKey(addDays(easter, -2))) {
    return { kind: 'holiday', label: 'Viernes Santo' };
  }

  return null;
}

export function getServiceCauseLabel(kind: ServiceCauseKind): string {
  switch (kind) {
    case 'holiday':
      return 'Festivo';
    case 'event':
      return 'Evento';
    case 'strike':
      return 'Huelga';
    case 'works':
      return 'Obras';
    case 'weather':
      return 'Meteo adversa';
    default:
      return 'Evento';
  }
}
