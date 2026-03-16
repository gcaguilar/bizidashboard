'use client';

import { useSyncExternalStore } from 'react';

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

export function ChartWrapper({ children, height = 'h-[280px]' }: ChartWrapperProps) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!mounted) {
    return <div className={height} />;
  }

  return <>{children}</>;
}
