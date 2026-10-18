'use client';

/**
 * Fallback de cliente para el PDF del informe.
 *
 * El servidor es la via principal: renderiza la pagina en Chromium y guarda el
 * PDF por mes. Si ese render falla, la API responde con el PDF de tablas y el
 * navegador captura esta misma pagina con html2pdf.js (html2canvas + jsPDF)
 * para que el lector siga recibiendo el informe con su diseno. El texto de este
 * PDF es una imagen; por eso solo se usa como respaldo.
 */

type ReportPdfDownloadOptions = {
  /** Elemento que contiene el informe completo. */
  root: HTMLElement;
  /** Nombre del archivo descargado. */
  filename: string;
};

/** Atributos de color SVG que pueden referenciar variables CSS de la pagina. */
const SVG_COLOR_ATTRIBUTES = ['fill', 'stroke', 'stop-color', 'flood-color'] as const;

const PDF_OPTIONS = {
  margin: [8, 8, 10, 8] as [number, number, number, number],
  image: { type: 'jpeg' as const, quality: 0.92 },
  html2canvas: {
    scale: 1.5,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 15_000,
    ignoreElements: (element: Element) => element.classList.contains('ui-print-hide'),
    onclone: (clonedDocument: Document) => {
      // El PDF se guarda siempre en el tema claro, igual que la impresion.
      clonedDocument.documentElement.classList.remove('dark');
      clonedDocument.documentElement.classList.add('light');
      clonedDocument.documentElement.style.colorScheme = 'light';
    },
  },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  pagebreak: { mode: ['css', 'legacy'], avoid: ['.ui-section-card', '.ui-page-hero'] },
};

/**
 * html2canvas convierte cada SVG en una imagen independiente. Al hacerlo se
 * pierde la hoja de estilos de la pagina y las referencias `var(--token)` del
 * SVG quedan sin resolver (barras y lineas en negro). Se sustituyen
 * temporalmente por el color ya calculado y se restauran al terminar.
 */
function resolveSvgColors(root: HTMLElement): () => void {
  const replaced: Array<{ element: Element; attribute: string; original: string }> = [];

  for (const element of root.querySelectorAll('svg, svg *')) {
    for (const attribute of SVG_COLOR_ATTRIBUTES) {
      const original = element.getAttribute(attribute);

      if (!original?.includes('var(')) {
        continue;
      }

      const resolved = window.getComputedStyle(element).getPropertyValue(attribute);

      if (!resolved) {
        continue;
      }

      replaced.push({ element, attribute, original });
      element.setAttribute(attribute, resolved);
    }
  }

  return () => {
    for (const { element, attribute, original } of replaced) {
      element.setAttribute(attribute, original);
    }
  };
}

export async function downloadReportPagePdf({
  root,
  filename,
}: ReportPdfDownloadOptions): Promise<void> {
  const { default: html2pdf } = await import('html2pdf.js');
  const restoreSvgColors = resolveSvgColors(root);

  try {
    await html2pdf()
      .set({ ...PDF_OPTIONS, filename })
      .from(root)
      .save();
  } finally {
    restoreSvgColors();
  }
}
