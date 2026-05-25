'use client';

import { useEffect } from 'react';

import { appRoutes } from '@/lib/routes';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    fetch(appRoutes.serviceWorker(), { method: 'HEAD' })
      .then((res) => {
        if (res.ok) {
          navigator.serviceWorker.register(appRoutes.serviceWorker(), { scope: appRoutes.home() }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
