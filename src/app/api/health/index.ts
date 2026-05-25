import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/api/health/')({
  server: {
    handlers: {
      GET: () => {
        throw redirect({ to: '/api/health/live' })
      },
    },
  },
})
