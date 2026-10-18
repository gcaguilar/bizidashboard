import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MonthlyReport } from '@/lib/monthly-report';
import {
  buildReportExportSections,
  type ReportExportSectionId,
} from '@/lib/monthly-report-export';
import { formatMonthLabel } from '@/lib/months';

/**
 * PDF del informe mensual generado en el servidor desde el payload ya
 * ensamblado. Modulo puro: no consulta fuentes ni conoce HTTP; devuelve los
 * bytes del documento y su nombre de archivo.
 *
 * Reutiliza las tablas planas de `monthly-report-export` para las secciones de
 * datos, y las secciones de texto (resumen, conclusiones, hallazgos,
 * recomendaciones) las redacta como prosa. El PDF sale de JS puro, sin binario
 * de navegador: el diseno de la pagina web se reproduce con `Imprimir / PDF`.
 */

const PAGE_MARGIN = 40;
const CONTENT_FONT_SIZE = 9;
const TABLE_FONT_SIZE = 8;
const LINE_HEIGHT = 14;
const BRAND: [number, number, number] = [234, 6, 21];
const MUTED: [number, number, number] = [96, 96, 96];
const BORDER: [number, number, number] = [214, 214, 214];

/** Secciones que el PDF redacta como texto en vez de como tabla. */
const PROSE_SECTIONS: ReportExportSectionId[] = ['conclusiones', 'hallazgos', 'recomendaciones'];

/** Secciones ya representadas en el encabezado; no se repiten como tabla. */
const SKIPPED_SECTIONS: ReportExportSectionId[] = ['resumen'];

/**
 * jsPDF escribe con la codificacion WinAnsi: los acentos castellanos van bien,
 * pero las comillas y rayas tipograficas se caen a tofu. Se normalizan a su
 * equivalente ASCII antes de dibujar.
 */
function normalizePdfText(value: string): string {
  return value
    .replace(/[\u2013\u2014]/gu, '-')
    .replace(/[\u2018\u2019]/gu, "'")
    .replace(/[\u201C\u201D]/gu, '"')
    .replace(/\u2026/gu, '...')
    .replace(/\u00A0/gu, ' ');
}

function toCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'string') {
    return normalizePdfText(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return normalizePdfText(JSON.stringify(value));
}

/**
 * Cabeceras de `monthly-report-export` en ASCII snake_case para que las hojas de
 * calculo no se rompan; en el PDF, que es un documento para leer, se muestran
 * con su etiqueta castellana acentuada. Las cabeceras nuevas caen al generador.
 */
const HEADER_LABELS: Record<string, string> = {
  metrica: 'Métrica',
  valor: 'Valor',
  mes: 'Mes',
  dia: 'Día',
  hora: 'Hora',
  muestras: 'Muestras',
  movimiento_estimado: 'Movimiento estimado',
  ocupacion_media: 'Ocupación media',
  estaciones_activas: 'Estaciones activas',
  bicis_disponibles_media: 'Bicis disponibles (media)',
  ranking: 'Ranking',
  barrio: 'Barrio',
  estaciones: 'Estaciones',
  horas_vacio: 'Horas sin bicis',
  horas_lleno: 'Horas sin huecos',
  horas_totales: 'Horas totales',
  horas_friccion: 'Horas de fricción',
  tasa_friccion: 'Tasa de fricción',
  estacion_id: 'ID estación',
  estacion: 'Estación',
  horas_manana: 'Horas (mañana)',
  horas_vacio_manana: 'Horas sin bicis (mañana)',
  horas_lleno_manana: 'Horas sin huecos (mañana)',
  tasa_vacio_manana: 'Tasa sin bicis (mañana)',
  tasa_lleno_manana: 'Tasa sin huecos (mañana)',
  tasa_friccion_manana: 'Tasa de fricción (mañana)',
  episodios: 'Episodios',
  media_vacio_min: 'Media sin bicis (min)',
  media_lleno_min: 'Media sin huecos (min)',
  max_vacio_min: 'Máx. sin bicis (min)',
  max_lleno_min: 'Máx. sin huecos (min)',
  rotacion: 'Rotación',
  baseline: 'Referencia',
  desviacion: 'Desviación',
  z: 'Z',
  direccion: 'Dirección',
  causa: 'Causa',
  demanda_media: 'Demanda media',
  conclusion: 'Conclusión',
  titulo: 'Título',
  detalle: 'Detalle',
  recomendacion: 'Recomendación',
};

function humanizeHeader(header: string): string {
  const label = HEADER_LABELS[header];

  if (label) {
    return label;
  }

  return normalizePdfText(header)
    .split('_')
    .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}

export function monthlyReportPdfFilename(monthKey: string): string {
  return `informe-${monthKey}.pdf`;
}

export function buildMonthlyReportPdf(report: MonthlyReport): ArrayBuffer {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  // `internal.getNumberOfPages` existe en tiempo de ejecucion pero no esta en
  // las firmas de tipos de jsPDF.
  const jsPdfWithPages = doc as jsPDF & { internal: { getNumberOfPages(): number } };
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  let cursorY = PAGE_MARGIN;
  const ensureSpace = (needed: number): void => {
    if (cursorY + needed > pageHeight - PAGE_MARGIN) {
      doc.addPage();
      cursorY = PAGE_MARGIN;
    }
  };

  const writeParagraph = (
    text: string,
    options: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number } = {}
  ): void => {
    const { size = CONTENT_FONT_SIZE, bold = false, color = [0, 0, 0], gap = LINE_HEIGHT } = options;
    const lines = doc.splitTextToSize(normalizePdfText(text), contentWidth) as string[];

    for (const line of lines) {
      ensureSpace(LINE_HEIGHT);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(line, PAGE_MARGIN, cursorY);
      cursorY += LINE_HEIGHT;
    }

    cursorY += gap - LINE_HEIGHT;
  };

  const writeSectionTitle = (title: string): void => {
    ensureSpace(LINE_HEIGHT * 2.2);
    cursorY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text(normalizePdfText(title), PAGE_MARGIN, cursorY);
    cursorY += LINE_HEIGHT * 1.2;
  };

  // ── Encabezado ───────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(BRAND[0], BRAND[1], BRAND[2]);
  doc.text('Informe mensual de Bizi Zaragoza', PAGE_MARGIN, cursorY);
  cursorY += 24;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(normalizePdfText(`Informe ${formatMonthLabel(report.monthKey)}`), PAGE_MARGIN, cursorY);
  cursorY += 22;

  writeParagraph(`Generado el ${report.generatedAt.slice(0, 10)}.`, {
    size: 9,
    color: MUTED,
    gap: 10,
  });

  // ── Resumen ejecutivo ────────────────────────────────────────────────────
  writeSectionTitle('Resumen ejecutivo');
  writeParagraph(report.balance.headline, { bold: true });
  writeParagraph(report.balance.detail, { color: MUTED, gap: 8 });
  writeParagraph(report.summary);

  const coverageNote =
    report.coverage.expectedDays > 0
      ? `${report.coverage.coveredDays} de ${report.coverage.expectedDays} días con datos (${report.coverage.label}).`
      : 'Sin días de cobertura registrados.';
  writeParagraph(
    `${coverageNote}${report.comparison.isComparable ? ` Comparación: ${report.comparison.periodLabel}.` : ''}`,
    { color: MUTED, gap: 12 }
  );

  // ── Titulares ───────────────────────────────────────────────────────────
  const { headline } = report;
  autoTable(doc, {
    startY: cursorY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [['Métrica', 'Valor']],
    body: [
      ['Movimiento estimado', toCell(headline.demandScore)],
      [
        'Variación frente al mes anterior',
        headline.demandDeltaRatio === null
          ? 'Sin comparación disponible'
          : `${headline.demandDeltaRatio >= 0 ? '+' : ''}${Math.round(headline.demandDeltaRatio * 100)} %`,
      ],
      ['Ocupación media', `${Math.round(headline.avgOccupancy * 100)} %`],
      [
        'Variación de ocupación',
        headline.occupancyDeltaRatio === null
          ? 'Sin comparación disponible'
          : `${headline.occupancyDeltaRatio >= 0 ? '+' : ''}${Math.round(headline.occupancyDeltaRatio * 100)} %`,
      ],
      ['Estaciones activas', toCell(headline.activeStations)],
      ['Días analizados', `${toCell(headline.coveredDays)} de ${toCell(headline.expectedDays)}`],
      ['Hora punta', headline.peakHour === null ? '-' : `${String(headline.peakHour).padStart(2, '0')}:00`],
      ['Picos anómalos', toCell(report.anomalies.length)],
    ],
    styles: { fontSize: TABLE_FONT_SIZE, cellPadding: 5, lineColor: BORDER, lineWidth: 0.5 },
    headStyles: {
      fillColor: BRAND,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: TABLE_FONT_SIZE + 0.5,
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });
  cursorY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY;
  cursorY += 12;

  // ── Secciones de texto ──────────────────────────────────────────────────
  const sections = buildReportExportSections(report);
  const proseById = new Map(sections.map((section) => [section.id, section]));

  for (const id of PROSE_SECTIONS) {
    const section = proseById.get(id);

    if (!section || section.rows.length === 0) {
      continue;
    }

    writeSectionTitle(section.title);

    for (const row of section.rows) {
      const cells = Array.isArray(row) ? row : section.headers.map((header) => (row as Record<string, unknown>)[header]);
      const text = cells.map((cell) => toCell(cell)).filter((cell) => cell !== '-').join('. ');

      if (text.trim().length === 0) {
        continue;
      }

      writeParagraph(`• ${text}`, { gap: 6 });
    }
  }

  // ── Tablas de datos ─────────────────────────────────────────────────────
  for (const section of sections) {
    if (SKIPPED_SECTIONS.includes(section.id) || PROSE_SECTIONS.includes(section.id)) {
      continue;
    }

    if (section.rows.length === 0) {
      continue;
    }

    ensureSpace(LINE_HEIGHT * 3);
    writeSectionTitle(section.title);

    const body = section.rows.map((row) => {
      const cells = Array.isArray(row)
        ? row
        : section.headers.map((header) => (row as Record<string, unknown>)[header]);
      return cells.map((cell) => toCell(cell));
    });

    autoTable(doc, {
      startY: cursorY,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [section.headers.map(humanizeHeader)],
      body,
      styles: {
        fontSize: TABLE_FONT_SIZE,
        cellPadding: 4,
        lineColor: BORDER,
        lineWidth: 0.4,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: BRAND,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: TABLE_FONT_SIZE,
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });

    cursorY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY;
    cursorY += 12;
  }

  // ── Pie con numero de pagina ────────────────────────────────────────────
  const totalPages = jsPdfWithPages.internal.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(
      normalizePdfText(
        `DatosBizi · Informe ${formatMonthLabel(report.monthKey)} · página ${page} de ${totalPages}`
      ),
      PAGE_MARGIN,
      pageHeight - 22
    );
  }

  return doc.output('arraybuffer');
}
