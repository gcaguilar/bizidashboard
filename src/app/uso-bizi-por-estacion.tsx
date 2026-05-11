import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/uso-bizi-por-estacion')({
  component: UsoBiziPorEstacionPage,
})

function UsoBiziPorEstacionPage() {
  return <div>uso-bizi-por-estacion</div>
}
