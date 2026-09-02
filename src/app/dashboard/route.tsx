import { Outlet, createFileRoute } from '@tanstack/react-router';
import { DashboardPageLoading } from '@/app/dashboard/_components/DashboardPageLoading';

export const Route = createFileRoute('/dashboard')({
  ssr: 'data-only',
  pendingComponent: DashboardRoutePending,
  component: DashboardParentRoute,
});

function DashboardParentRoute() {
  return <Outlet />;
}

function DashboardRoutePending() {
  return (
    <DashboardPageLoading
      title="Cargando el resumen"
      subtitle="Preparando los datos y el mapa"
    />
  );
}
