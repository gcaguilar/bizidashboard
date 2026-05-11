import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/viajes-por-dia-zaragoza')({
  component: ViajesPorDiaZaragozaPage,
})

function ViajesPorDiaZaragozaPage() {
  return <div>viajes-por-dia-zaragoza</div>
}
