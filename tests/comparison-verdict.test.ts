import { describe, expect, it } from 'vitest';
import type { InteractiveComparisonOption } from '@/lib/comparison-hub';
import { buildComparisonVerdict } from '@/lib/comparison-verdict';

function buildOption(
  overrides: Partial<InteractiveComparisonOption> = {}
): InteractiveComparisonOption {
  return {
    id: 'station-a',
    label: 'Plaza España',
    href: '/estadisticas/estaciones/a',
    primaryLabel: 'Giro',
    primaryValue: 20,
    primaryDisplay: '20 pts',
    secondaryLabel: 'Snapshot',
    secondaryDisplay: '10/20 bicis',
    tertiaryLabel: 'Horas sin servicio',
    tertiaryDisplay: '1 h',
    metrics: [
      { key: 'availability', label: 'Horas sin servicio', value: '1 h' },
      { key: 'bikes', label: 'Bicis disponibles (media)', value: '10 bicis' },
    ],
    bands: [
      {
        id: 'morning',
        label: 'Mañana',
        rangeLabel: '08–11 h',
        avgBikes: 12,
        avgAnchors: 8,
        sampleCount: 10,
        status: 'green',
        peakHour: null,
      },
    ],
    reliabilityScore: 0.9,
    ...overrides,
  };
}

describe('buildComparisonVerdict', () => {
  it('recommends the busiest station when it also keeps availability', () => {
    const verdict = buildComparisonVerdict({
      dimensionId: 'stations',
      left: buildOption(),
      right: buildOption({
        id: 'station-b',
        label: 'Plaza Aragón',
        primaryValue: 14,
        primaryDisplay: '14 pts',
        metrics: [
          { key: 'availability', label: 'Horas sin servicio', value: '5 h' },
          { key: 'bikes', label: 'Bicis disponibles (media)', value: '6 bicis' },
        ],
        reliabilityScore: 0.6,
      }),
    });

    expect(verdict?.headline).toContain('Plaza España');
    expect(verdict?.headline).toContain('43%');
    expect(verdict?.detail).toContain('5 h sin servicio');
    expect(verdict?.recommendation).toContain('Plaza España sale mejor parada');
    expect(verdict?.tone).toBe('positive');
  });

  it('warns when the busiest station is also the least reliable', () => {
    const verdict = buildComparisonVerdict({
      dimensionId: 'stations',
      left: buildOption({
        metrics: [{ key: 'availability', label: 'Horas sin servicio', value: '8 h' }],
        reliabilityScore: 0.4,
      }),
      right: buildOption({
        id: 'station-b',
        label: 'Plaza Aragón',
        primaryValue: 14,
        primaryDisplay: '14 pts',
        metrics: [{ key: 'availability', label: 'Horas sin servicio', value: '2 h' }],
        reliabilityScore: 0.8,
      }),
    });

    expect(verdict?.detail).toContain('8 h sin servicio');
    expect(verdict?.recommendation).toContain('Plaza Aragón ofrece mayor fiabilidad');
    expect(verdict?.tone).toBe('warning');
  });

  it('returns a neutral tie when both sides are equal', () => {
    const verdict = buildComparisonVerdict({
      dimensionId: 'districts',
      left: buildOption({ primaryLabel: 'Giro medio' }),
      right: buildOption({ id: 'station-b', label: 'Plaza Aragón', primaryLabel: 'Giro medio' }),
    });

    expect(verdict?.headline).toContain('empatan');
    expect(verdict?.tone).toBe('neutral');
  });
});
