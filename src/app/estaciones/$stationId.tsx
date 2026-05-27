import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/estaciones/$stationId')({
  loader: ({ params }) => {
    throw redirect({
      to: '/estadisticas/estaciones/$stationId',
      params: { stationId: params.stationId },
      replace: true,
    });
  },
});
