import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/redistribucion')({
  loader: () => { throw redirect({ to: '/estadisticas/redistribucion', replace: true }); },
});
