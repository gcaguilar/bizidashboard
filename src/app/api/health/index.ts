import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/api/health/')({
  server: {
    handlers: {
      GET: async () => {
        throw redirect({ to: '/api/health/live', status: 308 })
      },
    },
  },
})
