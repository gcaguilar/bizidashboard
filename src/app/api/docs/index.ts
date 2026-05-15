import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/api/docs/')({
  server: {
    handlers: {
      GET: async () => {
        throw redirect({ to: '/developers', status: 308 })
      },
    },
  },
})
