import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/ranking-estaciones-bizi')({
  component: RankingEstacionesBiziPage,
})

function RankingEstacionesBiziPage() {
  return <div>ranking-estaciones-bizi</div>
}
