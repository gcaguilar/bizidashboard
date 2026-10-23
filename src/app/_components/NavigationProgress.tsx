'use client';

import { useRouterState } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

/** Las navegaciones que resuelven antes de esto no muestran barra (evita parpadeos). */
const SHOW_AFTER_MS = 120;

/**
 * Barra fina arriba mientras el router espera loaders o chunks. El pending
 * component del router solo aparece pasado `defaultPendingMs` (1 s), asi que
 * hasta entonces un clic no daba ninguna señal de que algo estuviera cargando.
 */
export function NavigationProgress() {
  const isLoading = useRouterState({ select: (state) => state.isLoading });
  const [delayElapsed, setDelayElapsed] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const timer = window.setTimeout(() => setDelayElapsed(true), SHOW_AFTER_MS);
    return () => {
      window.clearTimeout(timer);
      setDelayElapsed(false);
    };
  }, [isLoading]);

  if (!isLoading || !delayElapsed) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 animate-pulse bg-[var(--primary)]"
    />
  );
}
