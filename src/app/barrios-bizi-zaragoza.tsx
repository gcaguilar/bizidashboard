import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route = createFileRoute('/barrios-bizi-zaragoza')({
  loader: () => { throw redirect({ to: '/estadisticas/barrios', replace: true }); },
});
