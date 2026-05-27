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
      title="Cargando dashboard"
      subtitle="Preparando datos operativos y modulos del mapa"
    />
  );
}
