import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { buildMonthlyReport, buildPracticalConclusions, computeSeasonality } from '@/lib/monthly-report';
import { buildReportBalance } from '@/lib/report-balance';
import { buildFallbackMonthlyReport } from '@/lib/shared-data-fallbacks';
import type { MonthlyReportTrends } from '@/lib/monthly-report';
import type { ServiceAnomaly } from '@/lib/service-anomalies';

const comparison = (overrides: Partial<Parameters<typeof buildReportBalance>[0]['comparison']> = {}) => ({
  isComparable: true,
  periodLabel: 'mes completo',
  reason: 'Ambos meses están cerrados y tienen cobertura completa.',
  normalizedDemandRatio: 0.2,
  trend: 'mejora' as const,
  previousMonthKey: '2026-02',
  ...overrides,
});

describe('buildReportBalance', () => {
  it('describes growth in plain language without a double sign', () => {
    const balance = buildReportBalance({
      previousMonthKey: '2026-02',
      comparison: comparison(),
    });

    expect(balance.tone).toBe('up');
    expect(balance.headline).toContain('creció un 20%');
    expect(balance.headline).toContain('febrero de 2026');
    expect(balance.headline).not.toContain('+');
  });

  it('describes a drop without a double sign', () => {
    const balance = buildReportBalance({
      previousMonthKey: '2026-02',
      comparison: comparison({ normalizedDemandRatio: -0.15, trend: 'empeora' }),
    });

    expect(balance.tone).toBe('down');
    expect(balance.headline).toContain('cayó un 15%');
    expect(balance.headline).not.toContain('-15%');
  });

  it('stays neutral when the change is inside the stable range', () => {
    const balance = buildReportBalance({
      previousMonthKey: '2026-02',
      comparison: comparison({ normalizedDemandRatio: 0.01, trend: 'estable' }),
    });

    expect(balance.tone).toBe('neutral');
    expect(balance.headline).toContain('estable');
  });

  it('explains itself when a comparison is not available', () => {
    const balance = buildReportBalance({
      previousMonthKey: '2026-02',
      comparison: comparison({
        isComparable: false,
        normalizedDemandRatio: null,
        trend: 'sin-datos',
        reason: 'No hay muestras equivalentes suficientes en el mes anterior.',
      }),
    });

    expect(balance.tone).toBe('unknown');
    expect(balance.detail).toContain('No hay muestras equivalentes');
  });
});

describe('computeSeasonality', () => {
  const row = (monthKey: string, demandScore: number): MonthlyReportTrends['monthly'][number] => ({
    monthKey,
    demandScore,
    avgOccupancy: 0.5,
    activeStations: 10,
    sampleCount: 100,
  });

  it('compares with the same calendar month in previous years', () => {
    const seasonality = computeSeasonality(
      [row('2025-02', 100), row('2026-01', 120), row('2026-02', 150)],
      '2026-02'
    );

    expect(seasonality.sameMonthYears).toBe(1);
    expect(seasonality.previousYearsAvgDemand).toBe(100);
    expect(seasonality.ratioVsPreviousYears).toBeCloseTo(0.5, 4);
    expect(seasonality.label).toContain('febrero');
    expect(seasonality.label).toContain('50%');
  });

  it('falls back to the series average when there is no previous year', () => {
    const seasonality = computeSeasonality([row('2026-01', 100), row('2026-02', 90)], '2026-02');

    expect(seasonality.sameMonthYears).toBe(0);
    expect(seasonality.previousYearsAvgDemand).toBeNull();
    expect(seasonality.ratioVsPreviousYears).toBeNull();
    expect(seasonality.label).toContain('media de la serie');
  });
});

describe('buildPracticalConclusions', () => {
  it('names the busiest weekday-hour window and the hardest district', () => {
    const conclusions = buildPracticalConclusions({
      heatmap: [
        { dayOfWeek: 2, hour: 8, occupancyAvg: 0.9, sampleCount: 30 },
        { dayOfWeek: 4, hour: 8, occupancyAvg: 0.88, sampleCount: 30 },
        { dayOfWeek: 1, hour: 8, occupancyAvg: 0.5, sampleCount: 30 },
      ],
      undersupplied: [
        {
          district: 'Centro',
          demandScore: 1000,
          avgOccupancy: 0.7,
          stations: 12,
          emptyHours: 40,
          fullHours: 20,
          totalHours: 200,
          frictionRate: 0.3,
        },
      ],
      anomalies: [],
    });

    expect(conclusions[0]).toContain('martes y jueves');
    expect(conclusions[0]).toContain('08:00–09:00');
    expect(conclusions[1]).toContain('Centro');
  });

  it('mentions the most atypical day when there is an anomaly', () => {
    const anomaly: ServiceAnomaly = {
      day: '2026-03-10',
      demandScore: 500,
      baseline: 200,
      deviationRatio: 1.5,
      zScore: 4,
      direction: 'up',
      cause: null,
    };

    const conclusions = buildPracticalConclusions({ heatmap: [], undersupplied: [], anomalies: [anomaly] });

    expect(conclusions).toHaveLength(1);
    expect(conclusions[0]).toContain('día más atípico');
    expect(conclusions[0]).toContain('sin causa identificada');
  });
});

describe('buildFallbackMonthlyReport', () => {
  it('returns an empty but well formed report for a valid month', () => {
    const report = buildFallbackMonthlyReport('2026-02', '2026-06-01T00:00:00.000Z');

    expect(report.monthKey).toBe('2026-02');
    expect(report.hasReport).toBe(false);
    expect(report.coverage.expectedDays).toBe(28);
    expect(report.trends.monthly).toHaveLength(0);
    expect(report.districts.mostActive).toHaveLength(0);
    expect(report.anomalies).toHaveLength(0);
    expect(report.monthlyConclusions).toHaveLength(0);
    expect(report.redistribution.ineffectiveStations).toHaveLength(0);
    expect(report.balance.tone).toBe('unknown');
  });

  it('never crashes on a malformed month key and falls back to the current month', () => {
    const report = buildFallbackMonthlyReport('nonsense', '2026-06-01T00:00:00.000Z');

    expect(report.hasReport).toBe(false);
    expect(report.monthKey).toBe('2026-06');
    expect(report.coverage.expectedDays).toBe(30);
  });
});

describe('buildMonthlyReport', () => {
  it('returns a fallback report for an invalid month key', async () => {
    const report = await buildMonthlyReport('2026-13', '2026-06-01T00:00:00.000Z');

    expect(report.hasReport).toBe(false);
    expect(report.monthKey).toBe('2026-06');
  });
});
