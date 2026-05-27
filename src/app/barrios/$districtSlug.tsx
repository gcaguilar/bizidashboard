import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/barrios/$districtSlug')({
  loader: ({ params }) => {
    throw redirect({
      to: '/estadisticas/barrios/$districtSlug',
      params: { districtSlug: params.districtSlug },
      replace: true,
    });
  },
});
