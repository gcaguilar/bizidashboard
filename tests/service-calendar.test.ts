import { describe, expect, it } from 'vitest';
import { getServiceCause, getServiceCauseLabel } from '@/lib/service-calendar';

describe('getServiceCause', () => {
  it('identifies fixed national holidays', () => {
    expect(getServiceCause('2026-01-01')).toEqual({ kind: 'holiday', label: 'Año Nuevo' });
    expect(getServiceCause('2026-12-25')).toEqual({ kind: 'holiday', label: 'Navidad' });
  });

  it('identifies the Pilar festival window as an event', () => {
    expect(getServiceCause('2026-10-11')).toEqual({ kind: 'event', label: 'Fiestas del Pilar' });
  });

  it('resolves Easter-based holidays for the requested year', () => {
    // Pascua 2026: 5 de abril. Jueves y Viernes Santo caen el 2 y el 3 de abril.
    expect(getServiceCause('2026-04-02')).toEqual({ kind: 'holiday', label: 'Jueves Santo' });
    expect(getServiceCause('2026-04-03')).toEqual({ kind: 'holiday', label: 'Viernes Santo' });
  });

  it('returns null for unremarkable days and malformed keys', () => {
    expect(getServiceCause('2026-02-18')).toBeNull();
    expect(getServiceCause('not-a-date')).toBeNull();
    expect(getServiceCause('2026-13-40')).toBeNull();
  });

  it('exposes readable labels per cause kind', () => {
    expect(getServiceCauseLabel('holiday')).toBe('Festivo');
    expect(getServiceCauseLabel('event')).toBe('Evento');
    expect(getServiceCauseLabel('strike')).toBe('Huelga');
    expect(getServiceCauseLabel('works')).toBe('Obras');
    expect(getServiceCauseLabel('weather')).toBe('Meteo adversa');
  });
});
