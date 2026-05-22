import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/viajes-por-dia-zaragoza')({
  loader: () => { throw redirect({ to: '/estadisticas/viajes', replace: true }); },
});
