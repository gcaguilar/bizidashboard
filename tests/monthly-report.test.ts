import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { buildMonthlyReport } from '@/lib/monthly-report';
import { buildReportBalance } from '@/lib/report-balance';
import { buildFallbackMonthlyReport } from '@/lib/shared-data-fallbacks';

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
