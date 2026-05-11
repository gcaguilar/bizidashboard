import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/barrios-bizi-zaragoza')({
  component: BarriosBiziZaragozaPage,
})

function BarriosBiziZaragozaPage() {
  return <div>barrios-bizi-zaragoza</div>
}
