import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/api/docs/')({
  server: {
    handlers: {
      // eslint-disable-next-line @typescript-eslint/require-await
      GET: async () => {
        throw redirect({ to: '/developers', status: 308 })
      },
    },
  },
})
