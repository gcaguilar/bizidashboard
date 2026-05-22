import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/ranking-estaciones-bizi')({
  loader: () => { throw redirect({ to: '/estadisticas/estaciones', replace: true }); },
});
