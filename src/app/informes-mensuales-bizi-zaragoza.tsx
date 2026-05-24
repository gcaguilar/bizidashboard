import { createFileRoute, redirect } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/informes-mensuales-bizi-zaragoza')({
  loader: () => { throw redirect({ to: appRoutes.reports(), replace: true }); },
});
