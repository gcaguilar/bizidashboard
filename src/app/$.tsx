import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  loader: async ({ params }) => {
    const path = params._splat ?? ''

    const redirects: Record<string, string> = {
      inicio: '/',
      'api/docs': '/developers',
    }

    if (path in redirects) {
      throw redirect({ to: redirects[path], replace: true })
    }

    if (path.startsWith('zaragoza/')) {
      const rest = path.slice('zaragoza/'.length)
      if (rest) {
        throw redirect({ to: `/${rest}`, replace: true })
      }
    }

    if (path.startsWith('dashboard/status')) {
      throw redirect({ to: '/estado', replace: true })
    }

    throw redirect({ to: '/', replace: true })
  },
})
