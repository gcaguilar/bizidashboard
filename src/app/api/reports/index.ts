import { createFileRoute } from '@tanstack/react-router'
import { errorResponse } from '@/lib/api-response'
import { csvSectionsResponse } from '@/lib/csv'
import { isValidMonthKey } from '@/lib/months'
import { buildMonthlyReport } from '@/lib/monthly-report'
import {
  buildReportExportSections,
  getReportExportSection,
  isReportExportSectionId,
} from '@/lib/monthly-report-export'
import {
  buildMonthlyReportPdf,
  monthlyReportPdfFilename,
} from '@/lib/monthly-report-pdf'
import { withPublicApiRoute } from '@/lib/security/public-api-route'

const SUCCESS_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=600'

/**
 * Export publico de un informe mensual. `format=json` devuelve el payload tal
 * cual; `format=csv` devuelve el informe completo como documento de secciones, o
 * una sola seccion con `section=<id>`; `format=pdf` devuelve un PDF generado en
 * servidor desde el payload. El ensamblado ya esta cacheado por mes, de modo que
 * la descarga no recalcula el informe.
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
            return new Response(buildMonthlyReportPdf(report), {
              status: 200,
              headers: {
                'Content-Type': 'application/pdf',
                'Cache-Control': SUCCESS_CACHE_CONTROL,
                'Content-Disposition': `attachment; filename="${monthlyReportPdfFilename(month)}"`,
              },
            })
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
