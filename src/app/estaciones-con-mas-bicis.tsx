import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route = createFileRoute('/estaciones-con-mas-bicis')({
  loader: () => { throw redirect({ to: '/estadisticas/estaciones', replace: true }); },
});
