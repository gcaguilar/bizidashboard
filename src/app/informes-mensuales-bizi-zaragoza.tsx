import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/informes-mensuales-bizi-zaragoza')({
  loader: () => { throw redirect({ to: '/informes', replace: true }); },
});