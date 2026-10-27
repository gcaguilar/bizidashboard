import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { resolveRedirectTarget } from '@/lib/routes'

export const Route = createFileRoute('/$')({
  loader: ({ params }) => {
    const path = params._splat ?? ''
    const pathname = `/${path}`

    // `/en/<ruta sin version inglesa>` cae a la ruta española equivalente.
    if (path.startsWith('en/')) {
      const spanishTarget: string = `/${path.slice('en/'.length)}`
      throw redirect({ to: spanishTarget, replace: true, statusCode: 308 })
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
