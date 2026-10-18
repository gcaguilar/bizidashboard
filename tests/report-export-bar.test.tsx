import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReportExportBar } from '@/app/informes/_components/ReportExportBar';

describe('ReportExportBar', () => {
  const html = renderToStaticMarkup(<ReportExportBar month="2026-03" />);

  it('offers the pdf download and the whole-report downloads', () => {
    expect(html).toContain('Descargar PDF');
    // El PDF se pide por fetch para poder caer a la captura del cliente; no es
    // un enlace directo en el HTML.
    expect(html).not.toContain('format=pdf');
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
