import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/estadisticas-bizi-zaragoza')({
  component: InsightsLandingPage,
})

function InsightsLandingPage() {
  return <div>estadisticas-bizi-zaragoza</div>
}
