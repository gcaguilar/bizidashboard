import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/uso-bizi-por-hora')({
  component: UsoBiziPorHoraPage,
})

function UsoBiziPorHoraPage() {
  return <div>uso-bizi-por-hora</div>
}
