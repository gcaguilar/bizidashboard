import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/viajes-por-mes-zaragoza')({
  component: ViajesPorMesZaragozaPage,
})

function ViajesPorMesZaragozaPage() {
  return <div>viajes-por-mes-zaragoza</div>
}
