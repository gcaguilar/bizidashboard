import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/estadisticas-bizi-zaragoza')({
  loader: () => { throw redirect({ to: '/estadisticas', replace: true }); },
});
