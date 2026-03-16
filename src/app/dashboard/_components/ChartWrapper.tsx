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
    return <div className={height} />;
  }

  return <>{children}</>;
});
