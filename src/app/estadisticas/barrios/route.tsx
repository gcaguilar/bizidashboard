import { Outlet, createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/estadisticas/barrios')({
  component: () => <Outlet />,
});
