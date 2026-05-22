import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route = createFileRoute('/uso-bizi-por-estacion')({
  loader: () => { throw redirect({ to: '/estadisticas/estaciones', replace: true }); },
});
