import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route = createFileRoute('/estaciones-mas-usadas-zaragoza')({
  loader: () => { throw redirect({ to: '/estadisticas/estaciones', replace: true }); },
});
