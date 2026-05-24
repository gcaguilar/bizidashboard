import { createFileRoute, redirect } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/uso-bizi-por-hora')({
  loader: () => { throw redirect({ to: appRoutes.statsHorarios(), replace: true }); },
});
