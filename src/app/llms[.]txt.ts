import { createFileRoute } from '@tanstack/react-router'
import { appRoutes } from '@/lib/routes'
import { getSiteUrl } from '@/lib/site'
import { localizePathname } from '@/lib/i18n/locales'

export function buildLlmsTxt(): string {
  const siteUrl = getSiteUrl()

  return [
    '# DatosBizi',
    '',
    '> Observatorio público e independiente de Bizi Zaragoza: disponibilidad en vivo, histórico, barrios, informes mensuales, API y datos abiertos. No es la web oficial del servicio ni su operador.',
    '',
    '## Páginas principales',
    `- ${siteUrl}${appRoutes.home()} - Resumen del estado actual de la red`,
    `- ${siteUrl}${appRoutes.dashboard()} - Mapa y panel operativo en vivo`,
    `- ${siteUrl}${appRoutes.faq()} - Preguntas frecuentes sobre Bizi y DatosBizi`,
    `- ${siteUrl}${appRoutes.cuantasEstaciones()} - Cuántas estaciones tiene Bizi Zaragoza`,
    `- ${siteUrl}${appRoutes.dondeHayBici()} - Dónde hay bicis y huecos ahora`,
    `- ${siteUrl}${appRoutes.comoFuncionaBizi()} - Cómo funciona el servicio`,
    `- ${siteUrl}${appRoutes.queAppBiciPublica()} - Qué app usar para bicis públicas`,
    `- ${siteUrl}${appRoutes.statsHub()} - Estadísticas y rankings`,
    `- ${siteUrl}${appRoutes.statsEstaciones()} - Estaciones y disponibilidad`,
    `- ${siteUrl}${appRoutes.districtLanding()} - Barrios de Zaragoza`,
    `- ${siteUrl}${appRoutes.reports()} - Informes mensuales`,
    `- ${siteUrl}${appRoutes.methodology()} - Metodología y límites de los datos`,
    `- ${siteUrl}${appRoutes.status()} - Frescura y cobertura de los datos`,
    `- ${siteUrl}${appRoutes.developers()} - API y datos abiertos`,
    `- ${siteUrl}${appRoutes.mcp()} - Conector MCP para asistentes`,
    `- ${siteUrl}${appRoutes.biciradar()} - BiciRadar, app de consulta en 5 ciudades`,
    `- ${siteUrl}${appRoutes.about()} - Quién hace DatosBizi`,
    `- ${siteUrl}${appRoutes.prensa()} - Datos clave, citación y contacto de prensa`,
    '',
    '## English version',
    `- ${siteUrl}${localizePathname(appRoutes.home(), 'en')} - Live status of the network (English)`,
    `- ${siteUrl}${localizePathname(appRoutes.methodology(), 'en')} - Methodology and data limits (English)`,
    `- ${siteUrl}/en/estadisticas/estaciones/{id} - Station sheets (English); other pages are Spanish only`,
    '',
    '## Índices y distribución',
    `- ${siteUrl}/sitemap.xml`,
    `- ${siteUrl}${appRoutes.llmsFull()}`,
    `- ${siteUrl}${appRoutes.feed()}`,
    `- ${siteUrl}${appRoutes.api.openApi()}`,
    '',
    '## API pública de lectura',
    `- ${siteUrl}${appRoutes.api.status()}`,
    `- ${siteUrl}${appRoutes.api.stations()}`,
    `- ${siteUrl}${appRoutes.api.rankings()}`,
    `- ${siteUrl}${appRoutes.api.mobility()}`,
    `- ${siteUrl}${appRoutes.api.history()}`,
    `- ${siteUrl}${appRoutes.api.alertsHistory()}`,
    '',
    '## Cómo citar',
    `- Fuente: DatosBizi (${siteUrl}), consultado el [fecha].`,
    '- Indica que las cifras de actividad son estimaciones y que la fuente primaria es el feed GBFS oficial de Bizi Zaragoza.',
    '- Para datos en vivo, enlaza a la página o endpoint consultado e incluye la hora de la última muestra.',
    '',
    '## Guidance for AI Assistants',
    '- Usa solo las rutas canónicas de esta lista; las antiguas rutas con ciudad o los alias redirigen.',
    '- Para el estado actual, prefiere páginas con fecha de última muestra y cita esa fecha.',
    '- No presentes el índice de actividad como número oficial de viajes.',
    '- Usa el documento OpenAPI como fuente de verdad para parámetros y respuestas de la API.',
    '- Si un dato es parcial o está obsoleto, dilo explícitamente.',
    '',
  ].join('\n')
}

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(buildLlmsTxt(), {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        }),
    },
  },
})
