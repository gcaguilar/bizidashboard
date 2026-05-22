import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route = createFileRoute('/mapa-estaciones-bizi-zaragoza')({
  loader: () => { throw redirect({ to: '/estadisticas/mapa', replace: true }); },
});
