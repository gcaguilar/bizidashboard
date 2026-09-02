import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { resolveRedirectTarget } from '@/lib/routes'

export const Route = createFileRoute('/$')({
  loader: ({ params }) => {
    const path = params._splat ?? ''
    const pathname = `/${path}`

    const redirects: Record<string, string> = {
      'api/docs': '/developers',
    }

    if (path in redirects) {
      throw redirect({ to: redirects[path], replace: true, status: 308 })
    }

    const target = resolveRedirectTarget(pathname)

    if (target) {
      throw redirect({ to: target, replace: true, status: 308 })
    }

    throw notFound()
  },
})
