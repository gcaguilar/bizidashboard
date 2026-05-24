import { createFileRoute, redirect } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/estaciones/$stationId')({
  loader: ({ params }) => { throw redirect({ href: appRoutes.stationDetail(params.stationId), replace: true }); },
});
