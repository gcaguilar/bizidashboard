import { createFileRoute, redirect } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/mapa-estaciones-bizi-zaragoza')({
  loader: () => { throw redirect({ to: appRoutes.dashboard(), replace: true }); },
});
