import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/barrios/$districtSlug')({
  loader: ({ params }) => { throw redirect({ to: `/estadisticas/barrios/${params.districtSlug}`, replace: true }); },
});
