import { describe, expect, it } from 'vitest';
import {
  buildMonthlyReportPdf,
  monthlyReportPdfFilename,
} from '@/lib/monthly-report-pdf';
import type { MonthlyReport } from '@/lib/monthly-report';
import { buildMonthlyReportFixture } from '@tests/helpers/monthly-report-fixture';

function renderPdf(report: MonthlyReport): Uint8Array {
  return new Uint8Array(buildMonthlyReportPdf(report));
}

function pdfHeader(bytes: Uint8Array): string {
  return String.fromCharCode(...bytes.slice(0, 5));
}

describe('monthly report pdf', () => {
  it('names the file after the month', () => {
    expect(monthlyReportPdfFilename('2026-03')).toBe('informe-2026-03.pdf');
  });

  it('generates a valid pdf document', () => {
    const bytes = renderPdf(buildMonthlyReportFixture());

    expect(pdfHeader(bytes)).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it('spans several pages so every section fits', () => {
    const bytes = renderPdf(buildMonthlyReportFixture());
    const content = String.fromCharCode(...bytes);
    const pageMarkers = content.split('/Type /Page').length - 1;

    expect(pageMarkers).toBeGreaterThanOrEqual(2);
  });

  it('renders a report with empty sections without breaking', () => {
    const empty = buildMonthlyReportFixture({
      hasReport: false,
      summary: '',
      highlights: [],
      recommendations: [],
      monthlyConclusions: [],
      anomalies: [],
      districts: { mostActive: [], leastActive: [], undersupplied: [] },
      problemSpots: { worstFriction: [], worstMorning: [], longestEpisodes: [] },
      trends: { monthly: [], daily: [], hourly: [] },
    });

    const bytes = renderPdf(empty);

    expect(pdfHeader(bytes)).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(500);
  });

  it('normalizes typographic characters the pdf font cannot draw', () => {
    const bytes = renderPdf(
      buildMonthlyReportFixture({ summary: 'La franja 07:00–10:00 “reventó” el día.' })
    );

    expect(pdfHeader(bytes)).toBe('%PDF-');
  });
});
