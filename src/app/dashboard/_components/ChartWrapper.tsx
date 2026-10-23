'use client';

import { memo, useSyncExternalStore } from 'react';

type ChartWrapperProps = {
  children: React.ReactNode;
  height?: string;
};

function getSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe() {
  return () => {};
}

export const ChartWrapper = memo(function ChartWrapper({ children, height = 'h-[280px]' }: ChartWrapperProps) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!mounted) {
    // Reserva el hueco con un esqueleto: hasta hidratar (y, en los informes, hasta
    // que baja el chunk de recharts) el area quedaba en blanco y parecia colgada.
    return <div aria-hidden="true" className={`${height} animate-pulse rounded-xl bg-[var(--border)]/40`} />;
  }

  return <>{children}</>;
});
