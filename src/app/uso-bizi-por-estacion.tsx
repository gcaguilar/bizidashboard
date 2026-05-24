import { createFileRoute, redirect } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/uso-bizi-por-estacion')({
  loader: () => { throw redirect({ to: appRoutes.statsEstaciones(), replace: true }); },
});
