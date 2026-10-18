import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReportExportBar } from '@/app/informes/_components/ReportExportBar';

describe('ReportExportBar', () => {
  const html = renderToStaticMarkup(<ReportExportBar month="2026-03" />);

  it('offers the print action and the whole-report downloads', () => {
    expect(html).toContain('Imprimir / PDF');
    expect(html).toContain('/api/reports?month=2026-03&amp;format=pdf"');
    expect(html).toContain('/api/reports?month=2026-03&amp;format=csv"');
    expect(html).toContain('/api/reports?month=2026-03"');
  });

  it('offers a per-section csv download for every export section', () => {
    expect(html).toContain('Exportar por sección (CSV)');
    expect(html).toContain('month=2026-03&amp;format=csv&amp;section=barrios');
    expect(html).toContain('month=2026-03&amp;format=csv&amp;section=anomalias');
  });

  it('is hidden when printing', () => {
    expect(html).toContain('ui-print-hide');
  });
});
