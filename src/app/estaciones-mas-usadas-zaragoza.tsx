import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/estaciones-mas-usadas-zaragoza')({
  component: EstacionesMasUsadasPage,
})

function EstacionesMasUsadasPage() {
  return <div>estaciones-mas-usadas-zaragoza</div>
}
