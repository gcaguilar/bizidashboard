'use client';

import { useState } from 'react';
import { listReportExportSections } from '@/lib/monthly-report-export';
import { downloadReportPagePdf } from '@/lib/report-pdf-download';
import { appRoutes } from '@/lib/routes';
import { WhatsAppShareLink } from '@/app/_components/WhatsAppShareLink';

type ReportExportBarProps = {
  month: string;
  shareUrl?: string;
  shareText?: string;
};

/** Cabecera que indica de donde salio el PDF servido por la API. */
const PDF_SOURCE_HEADER = 'X-Report-Pdf';

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Acciones de exportacion del informe: PDF del documento completo, descarga
 * CSV completa, JSON y export por seccion. Se oculta al imprimir.
 *
 * El PDF lo genera y guarda el servidor a partir de esta misma pagina. Si ese
 * render falla, la API devuelve el PDF de tablas y el navegador captura la
 * pagina con html2pdf.js, de modo que el lector sigue recibiendo el informe
 * con su diseno.
 */
export function ReportExportBar({ month, shareUrl, shareText }: ReportExportBarProps) {
  const sections = listReportExportSections();
  const [isGenerating, setIsGenerating] = useState(false);
  const filename = `informe-${month}.pdf`;

  const handleDownloadPdf = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch(appRoutes.api.reports({ month, format: 'pdf' }));

      if (!response.ok) {
        throw new Error(`PDF request failed with ${response.status}`);
      }

      const source = response.headers.get(PDF_SOURCE_HEADER);
      const blob = await response.blob();

      if (source !== 'table') {
        saveBlob(blob, filename);
        return;
      }

      // El servidor no pudo renderizar la pagina: se captura en el cliente.
      const root = document.querySelector<HTMLElement>('[data-report-export-root]');

      if (root) {
        try {
          await downloadReportPagePdf({ root, filename });
          return;
        } catch (error) {
          console.error('La captura del informe fallo; se descarga el PDF de tablas.', error);
        }
      }

      saveBlob(blob, filename);
    } catch (error) {
      console.error('No se pudo obtener el PDF; se abre la impresion.', error);
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="ui-section-card ui-print-hide">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-[var(--foreground)]">Exportar informe</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Descarga el informe completo en PDF, con el mismo diseño y gráficos que ves en esta
            página. También puedes bajar los datos en CSV o JSON.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            aria-busy={isGenerating}
            className="ui-primary-button"
          >
            {isGenerating ? 'Generando PDF…' : 'Descargar PDF'}
          </button>
          <a
            href={appRoutes.api.reports({ month, format: 'csv' })}
            download
            className="ui-inline-action"
          >
            Descargar CSV
          </a>
          <a href={appRoutes.api.reports({ month })} download className="ui-inline-action">
            Descargar JSON
          </a>
          {shareUrl ? (
            <WhatsAppShareLink
              url={shareUrl}
              text={shareText ?? `Informe de Bizi Zaragoza · ${month}`}
              source="report_export"
            />
          ) : null}
        </div>
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--foreground)]">
          Exportar por sección (CSV)
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={appRoutes.api.reports({ month, format: 'csv', section: section.id })}
              download
              className="ui-chip"
            >
              {section.title}
            </a>
          ))}
        </div>
      </details>
    </section>
  );
}
