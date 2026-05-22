import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/uso-bizi-por-hora')({
  loader: () => { throw redirect({ to: '/estadisticas/horarios', replace: true }); },
});
