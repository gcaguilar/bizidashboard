import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/api/geo/')({
  server: {
    handlers: {
      GET: () => {
        throw redirect({ to: '/api/geo/search' })
      },
    },
  },
})
