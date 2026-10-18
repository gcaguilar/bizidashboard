import { createFileRoute } from '@tanstack/react-router'
import { errorResponse } from '@/lib/api-response'
import { csvSectionsResponse } from '@/lib/csv'
import { logger } from '@/lib/logger'
import { isValidMonthKey } from '@/lib/months'
import { buildMonthlyReport, isClosedReportMonth } from '@/lib/monthly-report'
import {
  buildReportExportSections,
  getReportExportSection,
  isReportExportSectionId,
} from '@/lib/monthly-report-export'
import { renderMonthlyReportPagePdf } from '@/lib/monthly-report-page-pdf'
import {
  buildMonthlyReportPdf,
  monthlyReportPdfFilename,
} from '@/lib/monthly-report-pdf'
import {
  getStoredMonthlyReportPdf,
  storeMonthlyReportPdf,
} from '@/lib/monthly-report-pdf-store'
import type { MonthlyReport } from '@/lib/monthly-report'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { withPublicApiRoute } from '@/lib/security/public-api-route'

const SUCCESS_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=600'

/** Origen del PDF: la pagina renderizada o el fallback de tablas. */
type ReportPdfSource = 'page' | 'table'

type ReportPdfResult = {
  bytes: Uint8Array
  source: ReportPdfSource
}

/**
 * Evita que dos descargas simultaneas del mismo mes abran dos navegadores.
 * La generacion es idempotente: el resultado se persiste y las siguientes
 * peticiones lo leen de la base de datos.
 */
const inflightPdfRenders = new Map<string, Promise<ReportPdfResult>>()

/**
 * Un solo render de navegador a la vez por proceso: evita que varias descargas
 * de meses distintos levanten varios Chromium y agoten la memoria. Las
 * peticiones sobrantes esperan en cola.
 */
let pdfRenderQueue: Promise<unknown> = Promise.resolve()

function enqueuePdfRender<T>(task: () => Promise<T>): Promise<T> {
  const run = pdfRenderQueue.then(task, task)
  pdfRenderQueue = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

function pdfResponse({ bytes, source }: ReportPdfResult, month: string): Response {
  // Copia a un ArrayBuffer propio: `BodyInit` no acepta un Uint8Array sobre
  // memoria compartida.
  const body = new Uint8Array(bytes.byteLength)
  body.set(bytes)

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': SUCCESS_CACHE_CONTROL,
      'Content-Disposition': `attachment; filename="${monthlyReportPdfFilename(month)}"`,
      // La web usa esta cabecera para decidir si captura la pagina en el
      // cliente cuando el servidor no pudo renderizarla.
      'X-Report-Pdf': source,
    },
  })
}

/**
 * Devuelve el PDF publico del informe. Un mes cerrado se lee de la base de
 * datos; si aun no existe (o el mes sigue abierto) se renderiza la pagina y,
 * cuando el mes ya esta cerrado, se guarda para las siguientes descargas. Si
 * el render falla, se cae al PDF de tablas para no romper la descarga.
 */
async function resolveReportPdf(month: string, report: MonthlyReport): Promise<ReportPdfResult> {
  // Un mes sin informe publicado no merece un render de navegador: la pagina
  // solo mostraria el aviso de "informe en preparacion".
  if (!report.hasReport) {
    return { bytes: new Uint8Array(buildMonthlyReportPdf(report)), source: 'table' }
  }

  const closed = isClosedReportMonth(month, new Date().toISOString())

  if (closed) {
    const stored = await getStoredMonthlyReportPdf(month).catch((error) => {
      captureExceptionWithContext(error, {
        area: 'reports.pdf',
        operation: 'readStoredPdf',
        extra: { month },
      })
      logger.warn('reports.pdf_read_failed', { month, error })
      return null
    })

    if (stored) {
      return { bytes: stored, source: 'page' }
    }
  }

  const inflight = inflightPdfRenders.get(month)

  if (inflight) {
    return inflight
  }

  const render = (async () => {
    try {
      const bytes = await enqueuePdfRender(() => renderMonthlyReportPagePdf(month))

      if (closed) {
        await storeMonthlyReportPdf(month, bytes).catch((error) => {
          captureExceptionWithContext(error, {
            area: 'reports.pdf',
            operation: 'storePdf',
            extra: { month },
          })
          logger.warn('reports.pdf_store_failed', { month, error })
        })
      }

      return { bytes, source: 'page' as const }
    } catch (error) {
      captureExceptionWithContext(error, {
        area: 'reports.pdf',
        operation: 'renderPdf',
        extra: { month },
      })
      logger.warn('reports.pdf_render_failed', { month, error })
      return { bytes: new Uint8Array(buildMonthlyReportPdf(report)), source: 'table' as const }
    } finally {
      inflightPdfRenders.delete(month)
    }
  })()

  inflightPdfRenders.set(month, render)

  return render
}

/**
 * Export publico de un informe mensual. `format=json` devuelve el payload tal
 * cual; `format=csv` devuelve el informe completo como documento de secciones, o
 * una sola seccion con `section=<id>`; `format=pdf` devuelve el PDF de la propia
 * pagina, generado una vez y guardado al sellar el mes. El ensamblado ya esta
 * cacheado por mes, de modo que la descarga no recalcula el informe.
 */
export const Route = createFileRoute('/api/reports/')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: '/api/reports',
          routeGroup: 'api.reports',
          namespace: 'public-reports',
          limit: 30,
          windowMs: 60_000,
          requireApiKey: false,
        },
        async ({ request }) => {
          const url = new URL(request.url)
          const month = url.searchParams.get('month') ?? ''
          const format = url.searchParams.get('format')
          const section = url.searchParams.get('section')

          if (!isValidMonthKey(month)) {
            return errorResponse('Invalid month. Use YYYY-MM.', 400)
          }

          if (section !== null && !isReportExportSectionId(section)) {
            return errorResponse('Unknown section.', 400)
          }

          const report = await buildMonthlyReport(month, new Date().toISOString())

          if (format === 'pdf') {
            return pdfResponse(await resolveReportPdf(month, report), month)
          }

          if (format === 'csv') {
            const sections = section
              ? [getReportExportSection(report, section)]
              : buildReportExportSections(report)

            return csvSectionsResponse({
              sections,
              filename: section ? `informe-${month}-${section}.csv` : `informe-${month}.csv`,
              extraHeaders: { 'Cache-Control': SUCCESS_CACHE_CONTROL },
            })
          }

          return new Response(JSON.stringify(report), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': SUCCESS_CACHE_CONTROL,
            },
          })
        }
      ),
    },
  },
})
