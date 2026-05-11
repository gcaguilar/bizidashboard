import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/estaciones-con-mas-bicis')({
  component: EstacionesConMasBicisPage,
})

function EstacionesConMasBicisPage() {
  return <div>estaciones-con-mas-bicis</div>
}
