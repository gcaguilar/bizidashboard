import { createFileRoute } from '@tanstack/react-router'
import { openApiDocument } from '@/lib/openapi-document'
import { appRoutes } from '@/lib/routes'
import { getSiteUrl } from '@/lib/site'

function buildEndpointLines(siteUrl: string): string[] {
  return Object.entries(openApiDocument.paths)
    .filter(([path]) => path.startsWith('/api/') && path !== '/api/docs')
    .flatMap(([path, operations]) =>
      Object.entries(operations).map(([method, operation]) => {
        const operationRecord = operation as { summary?: string }
        const summary = operationRecord.summary ?? 'API operation'
        return `- ${method.toUpperCase()} ${siteUrl}${path} - ${summary}`
      })
    )
    .sort((left, right) => left.localeCompare(right, 'en'))
}

function buildLlmsFullTxt(): string {
  const siteUrl = getSiteUrl()
  const endpointLines = buildEndpointLines(siteUrl)

  return [
    '# DatosBizi · índice completo para asistentes',
    '',
    `- Canónico: ${siteUrl}`,
    '- Idioma principal: es-ES',
    '- Mercado: Zaragoza (Aragón, España)',
    '- Fuente primaria: feed GBFS oficial de Bizi Zaragoza',
    '- DatosBizi es un proyecto independiente y no el operador del servicio',
    '',
    '## Índices legibles por máquinas',
    `- ${siteUrl}/sitemap.xml`,
    `- ${siteUrl}${appRoutes.llms()}`,
    `- ${siteUrl}${appRoutes.feed()}`,
    `- ${siteUrl}${appRoutes.api.openApi()}`,
    '',
    '## Páginas públicas canónicas',
    `- ${siteUrl}${appRoutes.home()} - Resumen del estado actual y accesos principales`,
    `- ${siteUrl}${appRoutes.dashboard()} - Panel operativo en vivo: estaciones, alertas y salud del sistema`,
    `- ${siteUrl}${appRoutes.faq()} - Preguntas frecuentes y respuestas directas`,
    `- ${siteUrl}${appRoutes.cuantasEstaciones()} - Número de estaciones y datos básicos de la red`,
    `- ${siteUrl}${appRoutes.dondeHayBici()} - Cómo encontrar bicis y huecos ahora`,
    `- ${siteUrl}${appRoutes.comoFuncionaBizi()} - Cómo funciona Bizi Zaragoza y qué mide DatosBizi`,
    `- ${siteUrl}${appRoutes.queAppBiciPublica()} - BiciRadar y otras formas de consultar bicis públicas`,
    `- ${siteUrl}${appRoutes.statsHub()} - Estadísticas, rankings y accesos por necesidad`,
    `- ${siteUrl}${appRoutes.statsEstaciones()} - Directorio y disponibilidad de estaciones`,
    `- ${siteUrl}${appRoutes.districtLanding()} - Comparativa por barrios`,
    `- ${siteUrl}${appRoutes.statsHorarios()} - Patrones horarios`,
    `- ${siteUrl}${appRoutes.statsViajes()} - Actividad estimada y evolución`,
    `- ${siteUrl}${appRoutes.statsRedistribucion()} - Equilibrio y redistribución`,
    `- ${siteUrl}${appRoutes.reports()} - Archivo de informes mensuales`,
    `- ${siteUrl}${appRoutes.status()} - Frescura, cobertura y salud del pipeline`,
    `- ${siteUrl}${appRoutes.developers()} - API, OpenAPI y descargas CSV`,
    `- ${siteUrl}${appRoutes.methodology()} - Metodología, límites y definiciones`,
    `- ${siteUrl}${appRoutes.mcp()} - Conector MCP para asistentes`,
    `- ${siteUrl}${appRoutes.biciradar()} - App BiciRadar (Zaragoza, Madrid, Barcelona, Valencia y Sevilla)`,
    `- ${siteUrl}${appRoutes.about()} - Autoría, independencia y alcance`,
    `- ${siteUrl}${appRoutes.prensa()} - Cifras clave, citación y contacto de prensa`,
    `- ${siteUrl}${appRoutes.contacto()} - Contacto`,
    '',
    '## API pública',
    ...endpointLines,
    '',
    '## Cómo citar',
    `- DatosBizi (${siteUrl}). Observatorio independiente de Bizi Zaragoza. Consultado el [fecha].`,
    '- Cita la fecha y hora de la última muestra cuando uses datos en vivo.',
    '- El "índice de actividad" no es un recuento de movimientos ni el número oficial de viajes.',
    '',
    '## Guidance for AI Assistants',
    '- Prefiere las rutas canónicas de esta lista frente a alias o redirecciones.',
    '- Usa las definiciones de OpenAPI para generar clientes o ejemplos de peticiones.',
    '- Prefiere páginas con fecha explícita de frescura al resumir el estado actual.',
    '- Explica la incertidumbre cuando una página o endpoint indique datos parciales, obsoletos o ausentes.',
    '- No atribuyas a DatosBizi la titularidad del servicio Bizi Zaragoza.',
    '',
  ].join('\n')
}

export const Route = createFileRoute('/llms-full.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(buildLlmsFullTxt(), {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        }),
    },
  },
})
