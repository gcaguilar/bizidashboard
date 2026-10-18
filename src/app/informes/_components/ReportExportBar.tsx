import { listReportExportSections } from '@/lib/monthly-report-export';
import { appRoutes } from '@/lib/routes';

type ReportExportBarProps = {
  month: string;
};

/**
 * Acciones de exportacion del informe: impresion/PDF del documento completo,
 * descarga CSV completa, JSON y export por seccion. Se oculta al imprimir.
 */
export function ReportExportBar({ month }: ReportExportBarProps) {
  const sections = listReportExportSections();

  return (
    <section className="ui-section-card ui-print-hide">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-[var(--foreground)]">Exportar informe</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Descarga el informe en PDF, CSV o JSON, o imprímelo para guardarlo con el diseño de la
            página.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="ui-inline-action">
            Imprimir / PDF
          </button>
          <a
            href={appRoutes.api.reports({ month, format: 'pdf' })}
            download
            className="ui-primary-button"
          >
            Descargar PDF
          </a>
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
