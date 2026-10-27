import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { resolveRedirectTarget } from '@/lib/routes'
import { resolveLocaleRedirect } from '@/lib/i18n/locale-redirect'

export const Route = createFileRoute('/$')({
  loader: ({ params, location }) => {
    const path = params._splat ?? ''
    const pathname = `/${path}`

    // `/en/<ruta sin version inglesa>` cae a la ruta española equivalente y
    // `/EN/...`, `/en//...` a su grafia canonica, siempre en un unico salto y
    // conservando query y hash. `href` fija el `Location` tal cual (sin pasar
    // por el rewrite de salida, que depende de la pagina actual).
    const localeTarget = resolveLocaleRedirect(pathname)
    if (localeTarget) {
      const hash = location.hash ? `#${location.hash}` : ''
      throw redirect({
        href: `${localeTarget}${location.searchStr ?? ''}${hash}`,
        replace: true,
        statusCode: 308,
      })
    }

    const redirects: Record<string, string> = {
      'api/docs': '/developers',
    }

    if (path in redirects) {
      throw redirect({ to: redirects[path], replace: true, statusCode: 308 })
    }

    const target = resolveRedirectTarget(pathname)

    if (target) {
      throw redirect({ to: target, replace: true, statusCode: 308 })
    }

    throw notFound()
  },
})
