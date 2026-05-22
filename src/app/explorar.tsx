import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route = createFileRoute('/explorar')({
  loader: () => { throw redirect({ to: '/estadisticas', replace: true }); },
});
