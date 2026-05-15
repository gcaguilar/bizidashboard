import { createFileRoute } from '@tanstack/react-router'

async function getHandler() {
  return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const Route = createFileRoute('/api/health/ready')({
  server: {
    handlers: {
      GET: getHandler,
    },
  },
})

export const GET = getHandler
