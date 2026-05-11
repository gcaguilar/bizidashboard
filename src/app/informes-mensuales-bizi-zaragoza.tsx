import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/informes-mensuales-bizi-zaragoza')({
  component: InformesMensualesBiziZaragozaPage,
})

function InformesMensualesBiziZaragozaPage() {
  return <div>informes-mensuales-bizi-zaragoza</div>
}
