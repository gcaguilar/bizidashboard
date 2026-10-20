import { getRobotsBaseUrl, getRobotsSitemapUrl, isFallbackSiteUrl } from '@/lib/site'

// Permite que buscadores y asistentes usen el contenido como contexto y lo
// citen (search + ai-input), pero no que se use para entrenar modelos.
const CONTENT_SIGNAL_VALUE = 'ai-train=no, search=yes, ai-input=yes'

export function buildRobotsTxt(): string {
  const host = getRobotsBaseUrl()
  const hasPublicHost = !isFallbackSiteUrl(host)
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    `Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
    '',
    // Los asistentes pueden leer también los endpoints públicos de solo
    // lectura: llms.txt se los recomienda y el acceso a escritura sigue
    // protegido por métodos y autenticación en la capa de API.
    'User-agent: GPTBot',
    'Allow: /',
    `Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    `Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    `Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    `Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
  ]

  if (hasPublicHost) {
    lines.push('', `Host: ${host}`, `Sitemap: ${getRobotsSitemapUrl()}`)
  }

  return `${lines.join('\n')}\n`
}

export { CONTENT_SIGNAL_VALUE }
