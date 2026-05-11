import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/redistribucion-bizi-zaragoza')({
  component: RedistribucionBiziZaragozaPage,
})

function RedistribucionBiziZaragozaPage() {
  return <div>redistribucion-bizi-zaragoza</div>
}
