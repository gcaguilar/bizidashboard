import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/mapa-estaciones-bizi-zaragoza')({
  component: UtilityLandingPage,
})

function UtilityLandingPage() {
  return <div>mapa-estaciones-bizi-zaragoza</div>
}
